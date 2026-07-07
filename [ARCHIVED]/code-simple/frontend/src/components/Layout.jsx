import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { clearSession, getUser, api } from '../auth'

export const HexLogo = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 3L29 10.5V21.5L16 29L3 21.5V10.5L16 3Z" fill="#F5C518" opacity="0.18"/>
    <path d="M16 3L29 10.5V21.5L16 29L3 21.5V10.5L16 3Z" stroke="#F5C518" strokeWidth="1.5"/>
    <path d="M16 8.5L23 12.75V21.25L16 25.5L9 21.25V12.75L16 8.5Z" fill="#F5C518" opacity="0.45"/>
    <path d="M16 13L19.5 15V19L16 21L12.5 19V15L16 13Z" fill="#F5C518"/>
  </svg>
)

const TAB_DEFS = {
  '/admin/driver-checkin': 'Driver Check In Admin',
  '/admin/organizations': 'Organizations',
  '/home': 'Home',
}

export default function Layout({ children, showSidebar = true }) {
  const user = getUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [adminOpen, setAdminOpen] = useState(false)
  const [tabs, setTabs] = useState(() => {
    const here = TAB_DEFS[location.pathname]
    return here ? [{ path: location.pathname, title: here }] : []
  })
  const adminRef = useRef(null)

  // Keep tab list in sync with current route (open new tab if not present)
  useEffect(() => {
    if (TAB_DEFS[location.pathname] && !tabs.find(t => t.path === location.pathname)) {
      setTabs((t) => [...t, { path: location.pathname, title: TAB_DEFS[location.pathname] }])
    }
  }, [location.pathname]) // eslint-disable-line

  useEffect(() => {
    const onClick = (e) => {
      if (adminRef.current && !adminRef.current.contains(e.target)) setAdminOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const logout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }) } catch (_) {}
    clearSession()
    navigate('/login')
  }

  const closeTab = (path) => {
    const next = tabs.filter(t => t.path !== path)
    setTabs(next)
    if (location.pathname === path) navigate(next.length ? next[next.length - 1].path : '/home')
  }

  const goAdmin = (path, title) => {
    setAdminOpen(false)
    if (!tabs.find(t => t.path === path)) setTabs((t) => [...t, { path, title }])
    navigate(path)
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="t-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <HexLogo />
          <div className="t-wordmark"><span className="the">THE</span><span className="ims">IMS</span></div>
        </div>

        {/* Top-level menu items */}
        <div className="tab-bar" style={{ marginLeft: 18 }}>
          <NavLink to="/home" className={({ isActive }) => 'tab-item' + (isActive ? ' active' : '')}>
            Home
          </NavLink>
          {user?.role === 'ADMIN' && (
            <div ref={adminRef} style={{ position: 'relative' }}>
              <button
                className={'tab-item' + (location.pathname.startsWith('/admin') ? ' active' : '')}
                onClick={() => setAdminOpen(o => !o)}
                aria-haspopup="true"
                aria-expanded={adminOpen}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Administration ▾
              </button>
              {adminOpen && (
                <div className="dropdown" role="menu">
                  <button role="menuitem" onClick={() => goAdmin('/admin/driver-checkin', 'Driver Check In Admin')}>
                    Driver Check In Set Up
                  </button>
                  <button role="menuitem" onClick={() => goAdmin('/admin/organizations', 'Organizations')}>
                    Organizations
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="spacer"></div>

        <Link to="/mobile" className="facility-chip" style={{ textDecoration: 'none' }} title="Open mobile preview">
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/>
          </svg>
          Mobile Preview
        </Link>
        <div className="facility-chip" style={{ marginLeft: 8 }}>
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          Green Bay, WI
        </div>
        <div className="avatar" title={user?.name}>{user ? user.name.split(' ').map(s => s[0]).join('').slice(0,2) : '?'}</div>
        <button className="btn btn-secondary" style={{ marginLeft: 8, height: 28 }} onClick={logout}>Logout</button>
      </div>

      {/* Sub-tab bar (open IMS tabs) */}
      {tabs.length > 0 && (
        <div className="subtab-bar" role="tablist">
          {tabs.map((t) => (
            <div
              key={t.path}
              role="tab"
              aria-selected={location.pathname === t.path}
              className={'subtab' + (location.pathname === t.path ? ' active' : '')}
              onClick={() => navigate(t.path)}
            >
              {t.title}
              <span
                className="subtab-close"
                onClick={(e) => { e.stopPropagation(); closeTab(t.path) }}
                aria-label={`Close ${t.title} tab`}
              >×</span>
            </div>
          ))}
        </div>
      )}

      <div className="app-body">
        {showSidebar && location.pathname.startsWith('/admin') && (
          <nav className="sidebar">
            <div className="nav-group">Administration</div>
            <NavLink to="/admin/users" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>Users</NavLink>
            <NavLink to="/admin/facilities" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>Facilities</NavLink>
            <NavLink to="/admin/driver-checkin" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>Driver Check In Set Up</NavLink>
            <NavLink to="/admin/organizations" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>Organizations</NavLink>
          </nav>
        )}
        <main className="main">{children}</main>
      </div>
    </div>
  )
}
