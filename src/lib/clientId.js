const KEY = 'roastai_client_id'

export function getClientId() {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return 'fallback'
  }
}

// optional: dev convenience
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.getClientId = getClientId
}
