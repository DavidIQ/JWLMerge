const API_BASE = 'http://127.0.0.1:8000'

async function uploadSingle(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error('Upload failed: ' + res.status)
  return res.json()
}

export async function uploadFilesForMerge(fileA, fileB) {
  // Upload files first, then call merge_and_repack with returned paths
  const rA = await uploadSingle(fileA)
  const rB = await uploadSingle(fileB)

  const form = new FormData()
  // backend accepts 'a' and 'b' as form fields pointing to storage paths/names
  // also send 'orig' (use A as source of manifest by default)
  form.append('orig', rA.path)
  form.append('a', rA.path)
  form.append('b', rB.path)

  const res = await fetch(`${API_BASE}/merge_and_repack`, { method: 'POST', body: form })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error('Merge request failed: ' + res.status + ' ' + txt)
  }
  // parse JSON safely and return an object
  try {
    return await res.json()
  } catch (e) {
    // if server returned empty body or unexpected content, return a minimal object
    return { ok: true }
  }
}

export function downloadMergedUrl(path) {
  const url = `${API_BASE}/download?path=${encodeURIComponent(path)}`
  return url
}
