// Tiny auth helper — token in localStorage, fetch wrapper that injects it
// and surfaces 401/403 via a shared event.

const KEY_TOKEN = 'ims.token'
const KEY_USER = 'ims.user'

export function getToken() { return localStorage.getItem(KEY_TOKEN) }
export function getUser() {
  const raw = localStorage.getItem(KEY_USER)
  return raw ? JSON.parse(raw) : null
}

export function setSession(token, user) {
  localStorage.setItem(KEY_TOKEN, token)
  localStorage.setItem(KEY_USER, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(KEY_TOKEN)
  localStorage.removeItem(KEY_USER)
}

export async function api(path, opts = {}) {
  const token = getToken()
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  })
  if (res.status === 401) {
    clearSession()
    window.dispatchEvent(new CustomEvent('ims:unauthorized'))
    throw new Error('Session expired')
  }
  if (res.status === 403) {
    window.dispatchEvent(new CustomEvent('ims:forbidden'))
    throw new Error('Access denied')
  }
  return res
}
