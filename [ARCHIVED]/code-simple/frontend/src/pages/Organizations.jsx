import { useEffect, useState } from 'react'
import { api } from '../auth'

const empty = { name: '', address: '', phone: '' }

export default function Organizations() {
  const [orgs, setOrgs] = useState([])
  const [modal, setModal] = useState(null)  // {mode:'create'|'edit', form, id?}
  const [confirmDel, setConfirmDel] = useState(null)
  const [error, setError] = useState(null)

  const load = async () => {
    const res = await api('/api/organizations')
    if (res.ok) setOrgs(await res.json())
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setError(null)
    if (!modal.form.name.trim()) { setError('Organization name is required'); return }
    const url = modal.mode === 'create' ? '/api/organizations' : `/api/organizations/${modal.id}`
    const method = modal.mode === 'create' ? 'POST' : 'PUT'
    const res = await api(url, { method, body: JSON.stringify(modal.form) })
    if (res.ok) { setModal(null); load() }
  }

  const doDelete = async () => {
    const res = await api(`/api/organizations/${confirmDel.id}`, { method: 'DELETE' })
    if (res.ok) { setConfirmDel(null); load() }
  }

  return (
    <div>
      <div className="toolbar">
        <span className="page-title">Organizations</span>
        <button className="btn btn-primary" onClick={() => setModal({ mode: 'create', form: { ...empty } })}>+ New Organization</button>
      </div>

      <div className="card">
        <table className="ref-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Name</th>
              <th style={{ textAlign: 'left' }}>Address</th>
              <th style={{ textAlign: 'left' }}>Phone</th>
              <th style={{ width: 160, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map(o => (
              <tr key={o.id}>
                <td style={{ textAlign: 'left' }}>{o.name}</td>
                <td style={{ textAlign: 'left' }}>{o.address || <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>
                <td style={{ textAlign: 'left' }}>{o.phone || <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary" style={{ height: 26, fontSize: 11, marginRight: 6 }}
                    onClick={() => setModal({ mode: 'edit', id: o.id, form: { name: o.name, address: o.address, phone: o.phone }})}>
                    Edit
                  </button>
                  <button className="btn btn-secondary" style={{ height: 26, fontSize: 11 }}
                    onClick={() => setConfirmDel(o)}>Delete</button>
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>No organizations</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-box" style={{ textAlign: 'left', width: 420 }} role="dialog" aria-modal="true">
            <div className="modal-title" style={{ textAlign: 'left' }}>
              {modal.mode === 'create' ? 'New Organization' : 'Edit Organization'}
            </div>
            <label className="login-label">Name <span style={{ color: 'var(--s-critical)' }}>*</span></label>
            <input className="form-input" value={modal.form.name}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} />
            <label className="login-label">Address</label>
            <input className="form-input" value={modal.form.address}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, address: e.target.value } })} />
            <label className="login-label">Phone</label>
            <input className="form-input" value={modal.form.phone}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} />
            {error && <div role="alert" className="form-error" style={{ marginTop: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDel(null) }}>
          <div className="modal-box" style={{ width: 360 }}>
            <div className="modal-title">Delete "{confirmDel.name}"?</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--s-critical)', color: '#fff' }} onClick={doDelete}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
