import { Link } from 'react-router-dom'
import { getUser } from '../auth'

export default function Home() {
  const user = getUser()
  return (
    <div>
      <h1 className="page-h1">Welcome, {user?.name}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 18 }}>
        IMS — Enterprise WMS · Role: <strong>{user?.role}</strong>
      </p>

      <div className="home-grid">
        {user?.role === 'ADMIN' && (
          <>
            <Link to="/admin/driver-checkin" className="home-card">
              <div className="home-card-title">Driver Check In Set Up</div>
              <div className="home-card-sub">Configure check-in steps and validation</div>
            </Link>
            <Link to="/admin/organizations" className="home-card">
              <div className="home-card-title">Organizations</div>
              <div className="home-card-sub">Manage facility records</div>
            </Link>
          </>
        )}
        <Link to="/mobile" className="home-card">
          <div className="home-card-title">Mobile Check-In Preview</div>
          <div className="home-card-sub">Simulate the driver mobile experience</div>
        </Link>
        {user?.role !== 'ADMIN' && (
          <Link to="/admin/driver-checkin" className="home-card">
            <div className="home-card-title">Try Admin (will 403)</div>
            <div className="home-card-sub">Demonstrates role enforcement</div>
          </Link>
        )}
      </div>
    </div>
  )
}
