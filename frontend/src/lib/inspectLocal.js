import JSZip from 'jszip'
import { getSqlJs } from './sqlHelper'

export async function inspectLocal(file) {
  if (!file) throw new Error('Nenhum arquivo fornecido')
  const zip = await JSZip.loadAsync(file)

  const manifestEntry = zip.file('manifest.json')
  const manifest = manifestEntry ? JSON.parse(await manifestEntry.async('string')) : null

  const dbEntry = zip.file('userData.db')
  if (!dbEntry) throw new Error('userData.db não encontrado no arquivo .jwlibrary')
  const dbU8 = await dbEntry.async('uint8array')

  // get resilient sql.js instance (tries npm import, falls back to CDN)
  const SQL = await getSqlJs()
  const db = new SQL.Database(dbU8)

  // listar tabelas
  const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
  const tableNames = (tablesRes[0] && tablesRes[0].values) ? tablesRes[0].values.map(r => r[0]) : []

  const tables = {}
  for (const t of tableNames) {
    try {
      const cntRes = db.exec(`SELECT COUNT(*) as c FROM "${t}"`)
      const c = cntRes[0] ? Number(cntRes[0].values[0][0]) : 0
      const sampleRes = db.exec(`SELECT * FROM "${t}" LIMIT 5`)
      let sample = []
      if (sampleRes[0]) {
        const cols = sampleRes[0].columns
        sample = sampleRes[0].values.map(row => {
          const obj = {}
          row.forEach((v, i) => obj[cols[i]] = v)
          return obj
        })
      }
      tables[t] = { count: c, sample }
    } catch (e) {
      tables[t] = { error: String(e) }
    }
  }

  const integrityRes = db.exec('PRAGMA integrity_check;')
  const integrity = integrityRes[0] && integrityRes[0].values[0][0]

  db.close()

  return { manifest, tables, integrity }
}
