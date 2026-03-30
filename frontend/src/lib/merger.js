import JSZip from 'jszip'
import { getSqlJs } from './sqlHelper'

class IdTranslator {
  constructor() { this.map = new Map() }
  add(oldId, newId) { this.map.set(oldId, newId) }
  get(oldId) { return this.map.get(oldId) ?? 0 }
  has(oldId) { return this.map.has(oldId) }
  clear() { this.map.clear() }
}

const ID_COLUMNS = {
  Locations: 'LocationId',
  UserMarks: 'UserMarkId',
  Notes: 'NoteId',
  Tags: 'TagId',
  TagMaps: 'TagMapId',
  Bookmarks: 'BookmarkId',
  BlockRanges: 'BlockRangeId',
  IndependentMedias: 'IndependentMediaId',
  PlaylistItems: 'PlaylistItemId'
}

export async function mergeJwlFiles(files, { progress } = {}) {
  if (!files || files.length === 0) throw new Error('Nenhum arquivo para mesclar')

  const SQL = await getSqlJs()

  const firstZip = await JSZip.loadAsync(files[0])
  const manifestStr = firstZip.file('manifest.json') ? await firstZip.file('manifest.json').async('string') : null
  const firstDbU8 = await firstZip.file('userData.db').async('uint8array')
  const destDb = new SQL.Database(firstDbU8)

  const translators = {
    location: new IdTranslator(),
    userMark: new IdTranslator(),
    note: new IdTranslator(),
    tag: new IdTranslator(),
    independentMedia: new IdTranslator(),
    playlistItem: new IdTranslator()
  }

  for (let i = 1; i < files.length; i++) {
    if (progress) progress({ step: 'loading', index: i, total: files.length })
    const z = await JSZip.loadAsync(files[i])
    const dbU8 = await z.file('userData.db').async('uint8array')
    const srcDb = new SQL.Database(dbU8)

    const tables = Object.keys(ID_COLUMNS)
    for (const table of tables) {
      if (progress) progress({ step: 'merging_table', table, fileIndex: i })
      try {
        await mergeTable(srcDb, destDb, table, ID_COLUMNS[table], translators)
      } catch (e) {
        console.warn('mergeTable failed', table, e)
      }
    }

    srcDb.close()
  }

  const outU8 = destDb.export()
  destDb.close()

  const outZip = new JSZip()
  if (manifestStr) outZip.file('manifest.json', manifestStr)
  outZip.file('userData.db', outU8)

  const blob = await outZip.generateAsync({ type: 'blob' })
  return { blob, filename: 'merged.jwlibrary' }
}

export async function detectConflicts(fileA, fileB) {
  const SQL = await getSqlJs()
  const za = await JSZip.loadAsync(fileA)
  const zb = await JSZip.loadAsync(fileB)
  const aU8 = await za.file('userData.db').async('uint8array')
  const bU8 = await zb.file('userData.db').async('uint8array')
  const aDb = new SQL.Database(aU8)
  const bDb = new SQL.Database(bU8)

  const conflicts = []

  // iterate tables that exist in both DBs
  const tablesRes = aDb.exec("SELECT name FROM sqlite_master WHERE type='table'")
  const tables = (tablesRes && tablesRes[0]) ? tablesRes[0].values.map(r => r[0]) : []

  for (const t of tables) {
    if (t.startsWith('sqlite_')) continue
    // find primary key column
    const info = aDb.exec(`PRAGMA table_info("${t}")`)
    if (!info || !info[0]) continue
    const cols = info[0].values.map(r => ({ cid: r[0], name: r[1], pk: r[5] }))
    const pkCol = cols.find(c => c.pk)
    if (!pkCol) continue

    // get rows from both
    const aRowsRes = aDb.exec(`SELECT * FROM "${t}"`)
    const bRowsRes = bDb.exec(`SELECT * FROM "${t}"`)
    const aRows = (aRowsRes && aRowsRes[0]) ? toRowObjects(aRowsRes[0]) : []
    const bRows = (bRowsRes && bRowsRes[0]) ? toRowObjects(bRowsRes[0]) : []

    const aMap = new Map(aRows.map(r => [r[pkCol.name], r]))
    const bMap = new Map(bRows.map(r => [r[pkCol.name], r]))

    for (const [key, aRow] of aMap.entries()) {
      if (bMap.has(key)) {
        const bRow = bMap.get(key)
        if (!rowsEqual(aRow, bRow)) {
          conflicts.push({ table: t, key: key, keyCol: pkCol.name, a: aRow, b: bRow })
        }
      }
    }
  }

  aDb.close()
  bDb.close()
  return conflicts
}

function toRowObjects(result) {
  const cols = result.columns
  return result.values.map(vals => {
    const o = {}
    for (let i = 0; i < cols.length; i++) o[cols[i]] = vals[i]
    return o
  })
}

function rowsEqual(a, b) {
  // simple deep compare by JSON (stable for our needs)
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch (e) { return false }
}

export async function mergeWithChoices(fileA, fileB, choices, { progress } = {}) {
  // choices: array of {table, keyCol, key, pick: 'A'|'B'}
    const SQL = await getSqlJs()
  const za = await JSZip.loadAsync(fileA)
  const zb = await JSZip.loadAsync(fileB)
  const aU8 = await za.file('userData.db').async('uint8array')
  const bU8 = await zb.file('userData.db').async('uint8array')

  // start from A as base
  const destDb = new SQL.Database(aU8)
  const bDb = new SQL.Database(bU8)

  // apply choices where pick === 'B'
  for (const c of choices) {
    if (c.pick !== 'B') continue
    const t = c.table
    const keyCol = c.keyCol
    const key = c.key
    // fetch row from B
    const sel = bDb.exec(`SELECT * FROM "${t}" WHERE "${keyCol}" = ${quoteValue(key)}`)
    if (!sel || !sel[0]) continue
    const rowObj = toRowObjects(sel[0])[0]
    const cols = Object.keys(rowObj)
    // delete existing row in destDb and insert values from B
    destDb.run(`DELETE FROM "${t}" WHERE "${keyCol}" = ${quoteValue(key)}`)
    const insertSql = `INSERT INTO "${t}" (${cols.map(cn => `"${cn}"`).join(',')}) VALUES (${cols.map(() => '?').join(',')})`
    const stmt = destDb.prepare(insertSql)
    const vals = cols.map(cn => rowObj[cn])
    try {
      stmt.run(vals)
    } finally {
      try { stmt.free() } catch (e) { /* ignore */ }
    }
  }

  // export and create zip
  // run PRAGMA integrity_check before exporting
  try {
    const pragmaRes = destDb.exec("PRAGMA integrity_check;")
    if (pragmaRes && pragmaRes[0] && pragmaRes[0].values && pragmaRes[0].values[0] && pragmaRes[0].values[0][0]) {
      const val = pragmaRes[0].values[0][0]
      if (val !== 'ok') {
        throw new Error('PRAGMA integrity_check failed: ' + val)
      }
    }
  } catch (e) {
    destDb.close()
    bDb.close()
    throw e
  }

  const outU8 = destDb.export()
  destDb.close()
  bDb.close()

  const outZip = new JSZip()
  // try to reuse manifest from A
  const manifestStr = za.file('manifest.json') ? await za.file('manifest.json').async('string') : null
  if (manifestStr) outZip.file('manifest.json', manifestStr)
  outZip.file('userData.db', outU8)
  const blob = await outZip.generateAsync({ type: 'blob' })
  return { blob, filename: 'merged-with-choices.jwlibrary', integrity: 'ok' }
}

function quoteValue(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return v
  return `'${String(v).replace(/'/g, "''")}'`
}

async function mergeTable(srcDb, destDb, tableName, idCol, translators) {
  const tblInfo = srcDb.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`)
  if (!tblInfo || tblInfo.length === 0) return

  const pragma = destDb.exec(`PRAGMA table_info("${tableName}")`)
  if (!pragma || pragma.length === 0) return
  const cols = pragma[0].values.map(r => r[1])

  let maxIdRes = destDb.exec(`SELECT MAX(${idCol}) FROM "${tableName}"`)
  let maxId = 0
  if (maxIdRes && maxIdRes[0] && maxIdRes[0].values[0][0] != null) maxId = Number(maxIdRes[0].values[0][0])

  const sel = srcDb.exec(`SELECT * FROM "${tableName}"`)
  if (!sel || sel.length === 0) return

  const rows = sel[0].values
  const colNames = sel[0].columns

  const insertSql = `INSERT INTO "${tableName}" (${colNames.map(c => `"${c}"`).join(',')}) VALUES (${colNames.map(() => '?').join(',')})`
  const stmt = destDb.prepare(insertSql)

    try {
      for (const r of rows) {
    const rowObj = {}
    for (let k = 0; k < colNames.length; k++) rowObj[colNames[k]] = r[k]

    if (idCol && rowObj[idCol] != null) {
      const oldId = Number(rowObj[idCol])
      const newId = ++maxId
      rowObj[idCol] = newId
      const tr = translatorForTable(tableName, translators)
      if (tr) tr.add(oldId, newId)
    }

    for (const cn of colNames) {
      if (cn === idCol) continue
      if (cn.toLowerCase().endsWith('id') && rowObj[cn] != null) {
        const ref = rowObj[cn]
        const refTr = findTranslatorForColumn(cn, translators)
        if (refTr) {
          const mapped = refTr.get(Number(ref))
          rowObj[cn] = mapped || null
        }
      }
    }

    const values = colNames.map(cn => rowObj[cn])
    stmt.run(values)
    }
  } finally {
    try { stmt.free() } catch (e) { /* ignore */ }
  }
}

function translatorForTable(tableName, translators) {
  switch (tableName) {
    case 'Locations': return translators.location
    case 'UserMarks': return translators.userMark
    case 'Notes': return translators.note
    case 'Tags': return translators.tag
    case 'IndependentMedias': return translators.independentMedia
    case 'PlaylistItems': return translators.playlistItem
    default: return null
  }
}

function findTranslatorForColumn(columnName, translators) {
  if (columnName.toLowerCase().includes('locationid')) return translators.location
  if (columnName.toLowerCase().includes('usermarkid')) return translators.userMark
  if (columnName.toLowerCase().includes('noteid')) return translators.note
  if (columnName.toLowerCase().includes('tagid')) return translators.tag
  if (columnName.toLowerCase().includes('independentmediaid')) return translators.independentMedia
  if (columnName.toLowerCase().includes('playlistitemid')) return translators.playlistItem
  return null
}
