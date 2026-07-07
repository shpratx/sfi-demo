import { useNavigate } from 'react-router-dom'

export default function Forbidden() {
  const navigate = useNavigate()
  return (
    <div className="forbidden">
      <div className="forbidden-code">403</div>
      <h1>Access Denied</h1>
      <p>You don't have permission to access this page.</p>
      <button className="btn btn-primary" onClick={() => navigate('/home')}>Return to Home</button>
    </div>
  )
}
