import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setSession } from '../auth'
import { HexLogo } from '../components/Layout'

export default function Login() {
  const [email, setEmail] = useState('admin@schreiber.com')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        setError('Invalid credentials')
        return
      }
      const data = await res.json()
      setSession(data.token, data.user)
      navigate('/home')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">
          <HexLogo size={42} />
          <div className="t-wordmark" style={{ fontSize: 22 }}>
            <span className="the">THE</span><span className="hive">HIVE</span>
          </div>
        </div>
        <div className="login-sub">Driver Check In Admin</div>

        <label className="login-label" htmlFor="email">Email</label>
        <input id="email" className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label className="login-label" htmlFor="password">Password</label>
        <input id="password" className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <div role="alert" className="form-error" style={{ marginTop: 8 }}>{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 14, height: 36 }}>
          {loading ? 'Signing in…' : 'Log In'}
        </button>

        <div className="login-hint">
          <strong>Demo accounts</strong><br/>
          admin@schreiber.com / admin (ADMIN)<br/>
          user@schreiber.com / user (STANDARD)
        </div>
      </form>
    </div>
  )
}
