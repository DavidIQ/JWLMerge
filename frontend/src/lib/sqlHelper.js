// Resilient loader for sql.js (tries multiple import paths, falls back to CDN)
const CDN_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/'
const CDN_WASM = CDN_BASE + 'sql-wasm.wasm'
const CDN_SCRIPT = CDN_BASE + 'sql-wasm.js'

function _locateFileForCDN(file) {
  // sql.js expects the wasm file name; map to CDN base
  return CDN_BASE + file
}

export async function getSqlJs() {
  // First: if initSqlJs already present (e.g., cached or previously loaded), use it
  if (typeof window !== 'undefined' && typeof window.initSqlJs === 'function') {
    try {
      return await window.initSqlJs({ locateFile: _locateFileForCDN })
    } catch (e) {
      console.debug('window.initSqlJs present but failed:', e)
    }
  }

  // Next: try to inject the CDN UMD build — this avoids bare-specifier import errors
  try {
    await new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${CDN_SCRIPT}"]`)
      if (existing) return existing.addEventListener('load', () => resolve())
      const s = document.createElement('script')
      s.src = CDN_SCRIPT
      s.async = true
      s.crossOrigin = 'anonymous'
      s.onload = () => resolve()
      s.onerror = (err) => reject(new Error('Failed to load sql.js from CDN: ' + err))
      document.head.appendChild(s)
    })
    if (typeof window !== 'undefined' && typeof window.initSqlJs === 'function') {
      return await window.initSqlJs({ locateFile: _locateFileForCDN })
    }
  } catch (cdnErr) {
    console.debug('CDN load failed, will attempt module imports as fallback:', cdnErr)
  }

  // Finally: try module imports (some environments provide these)
  const attempts = [
    'sql.js/dist/sql-wasm.mjs',
    'sql.js/dist/sql-wasm.js',
    'sql.js'
  ]

  for (const spec of attempts) {
    try {
      const mod = await import(spec)
      const init = (mod && (mod.default || mod.initSqlJs || mod))
      if (typeof init === 'function') {
        try {
          return await init({ locateFile: _locateFileForCDN })
        } catch (inner) {
          console.debug('sql.js import OK but init failed for', spec, inner)
        }
      }
      if (mod && typeof mod.initSqlJs === 'function') {
        return await mod.initSqlJs({ locateFile: _locateFileForCDN })
      }
    } catch (e) {
      console.debug('sql.js import failed for', spec, e)
    }
  }

  throw new Error('sql.js loader unavailable')
}

export { CDN_WASM }
