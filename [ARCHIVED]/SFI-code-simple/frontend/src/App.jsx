import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import Forbidden from './pages/Forbidden'
import Settings from './pages/Settings'
import Organizations from './pages/Organizations'
import MobilePreview from './pages/MobilePreview'
import { getUser } from './auth'

function RequireAuth({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/403" replace />
  return children
}

function GlobalListeners() {
  const navigate = useNavigate()
  useEffect(() => {
    const onUnauth = () => navigate('/login')
    const onForbidden = () => navigate('/403')
    window.addEventListener('hive:unauthorized', onUnauth)
    window.addEventListener('hive:forbidden', onForbidden)
    return () => {
      window.removeEventListener('hive:unauthorized', onUnauth)
      window.removeEventListener('hive:forbidden', onForbidden)
    }
  }, [navigate])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalListeners />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/home" element={<RequireAuth><Layout><Home /></Layout></RequireAuth>} />
        <Route path="/403" element={<RequireAuth><Layout><Forbidden /></Layout></RequireAuth>} />
        <Route path="/mobile" element={<RequireAuth><Layout><MobilePreview /></Layout></RequireAuth>} />

        <Route path="/admin/driver-checkin" element={<RequireAdmin><Layout><Settings /></Layout></RequireAdmin>} />
        <Route path="/admin/organizations" element={<RequireAdmin><Layout><Organizations /></Layout></RequireAdmin>} />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
