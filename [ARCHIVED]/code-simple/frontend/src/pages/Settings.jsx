import { useEffect, useState, useCallback } from 'react'
import { api } from '../auth'

const ErrorIcon = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

function Toggle({ checked, disabled, onChange, ariaLabel }) {
  return (
    <label className="toggle" aria-label={ariaLabel}>
      <input type="checkbox" checked={!!checked} disabled={disabled}
             onChange={(e) => onChange?.(e.target.checked)} />
      <span className="slider"></span>
    </label>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [errors, setErrors] = useState({})
  const [savedFlash, setSavedFlash] = useState(false)
  const [qr, setQr] = useState(null)

  useEffect(() => {
    api('/api/settings').then(r => r.ok && r.json()).then(setSettings).catch(() => {})
  }, [])

  const flashSaved = () => {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
  }

  const patch = useCallback(async (field, value) => {
    const res = await api('/api/settings', {
      method: 'PATCH', body: JSON.stringify({ field, value }),
    })
    if (res.ok) { setSettings(await res.json()); flashSaved() }
  }, [])

  const validateField = useCallback(async (field, value) => {
    const res = await api('/api/validate', {
      method: 'POST', body: JSON.stringify({ field, value }),
    })
    const data = await res.json()
    setErrors((prev) => {
      const next = { ...prev }
      if (data.ok) delete next[field]; else next[field] = data.error
      return next
    })
    return data.ok
  }, [])

  const handleBlur = async (field, value, required) => {
    if (required) {
      const ok = await validateField(field, value)
      if (!ok) return
    }
    await patch(field, value)
  }

  const setLocal = (field, value) => setSettings((s) => ({ ...s, [field]: value }))

  const handleToggle = async (field, value, clearFields = []) => {
    setLocal(field, value)
    await patch(field, value)
    if (!value) {
      setErrors((prev) => {
        const next = { ...prev }
        clearFields.forEach((f) => delete next[f])
        return next
      })
    }
  }

  const openQr = async () => {
    const res = await api('/api/qrcode', { method: 'POST' })
    if (res.ok) setQr(await res.json())
  }

  const printQr = () => {
    if (!qr) return
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>${qr.title}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:40px">
        <h2>${qr.title}</h2>
        <img src="${qr.imageDataUrl}" style="width:300px;height:300px"/>
        <script>window.onload = () => window.print()</script>
      </body></html>`)
    w.document.close()
  }

  const savePdf = () => {
    if (!qr) return
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>${qr.title}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:40px">
        <h2>${qr.title}</h2>
        <img src="${qr.imageDataUrl}" style="width:300px;height:300px"/>
        <p style="color:#555;font-size:12px;margin-top:16px">Use your browser's print dialog → "Save as PDF" to download.</p>
        <script>window.onload = () => window.print()</script>
      </body></html>`)
    w.document.close()
  }

  if (!settings) return <div style={{ padding: 40 }}>Loading…</div>

  return (
    <>
      <div className="toolbar">
        <span className="page-title">Driver Check In Admin</span>
        <span className="auto-save-note">
          {savedFlash ? <span className="save-flash">✓ Saved</span> : 'Changes auto-saved on focus out'}
        </span>
      </div>

      <div className="card">
        <div className="setting">
          <div className="toggle-col"><Toggle checked disabled ariaLabel="Organization Name — always on" /></div>
          <div className="content-col">
            <div className="setting-name">Organization Name</div>
            <input className="form-input" type="text" value={settings.organizationName} disabled />
            <div className="setting-help">Pre-populated from user login. Toggle always ON.</div>
          </div>
        </div>

        <div className="setting">
          <div className="toggle-col">
            <Toggle checked={settings.qrCodeAccess} ariaLabel="QR Code Check In Access"
              onChange={(v) => handleToggle('qrCodeAccess', v)} />
          </div>
          <div className="content-col">
            <div className="setting-name">QR Code Check In Access</div>
            <div style={{ marginTop: 7 }}>
              <button className="btn btn-primary" onClick={openQr}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <path d="M14 14h.01M14 17h3M17 14h3M17 17v4M20 14v.01"/>
                </svg>
                Generate QR Code
              </button>
            </div>
          </div>
        </div>

        <div className="setting">
          <div className="toggle-col"><Toggle checked disabled ariaLabel="Driver Name — always on" /></div>
          <div className="content-col">
            <div className="setting-name">Driver Name</div>
            <div className="setting-help">Always required. Toggle always ON.</div>
          </div>
        </div>

        <div className="setting">
          <div className="toggle-col">
            <Toggle checked={settings.driverId} ariaLabel="Driver ID"
              onChange={(v) => handleToggle('driverId', v)} />
          </div>
          <div className="content-col">
            <div className="setting-name">Driver ID</div>
            <div className="setting-help">Toggle active — can be disabled if not required.</div>
          </div>
        </div>

        <div className="setting">
          <div className="toggle-col"><Toggle checked disabled ariaLabel="Driver Phone Number — always on" /></div>
          <div className="content-col">
            <div className="setting-name">Driver Phone Number</div>
            <div className="setting-help">Always required. Toggle always ON.</div>
          </div>
        </div>

        <div className="setting">
          <div className="toggle-col"><Toggle checked disabled ariaLabel="Truck Number — always on" /></div>
          <div className="content-col">
            <div className="setting-name">Truck Number</div>
            <div className="setting-help">Always required. Toggle always ON.</div>
          </div>
        </div>

        <div className="setting">
          <div className="toggle-col">
            <Toggle checked={settings.carrierApproval} ariaLabel="Carrier Approval Step"
              onChange={(v) => handleToggle('carrierApproval', v)} />
          </div>
          <div className="content-col">
            <div className="setting-name">Carrier Approval Step</div>
            <div className="setting-help">Toggle active — disable to skip carrier approval during check-in.</div>
          </div>
        </div>

        <div className="setting">
          <div className="toggle-col">
            <Toggle checked={settings.temperatureEnabled} ariaLabel="Temperature Acknowledgement Step"
              onChange={(v) => handleToggle('temperatureEnabled', v, ['temperatureRange'])} />
          </div>
          <div className="content-col">
            <div className="setting-name">Temperature Acknowledgement Step</div>
            <input className={`form-input ${errors.temperatureRange ? 'err' : ''}`} type="text"
              placeholder="e.g., 35°F – 40°F" value={settings.temperatureRange}
              disabled={!settings.temperatureEnabled}
              onChange={(e) => setLocal('temperatureRange', e.target.value)}
              onBlur={(e) => handleBlur('temperatureRange', e.target.value, settings.temperatureEnabled)} />
            {errors.temperatureRange && <div className="form-error"><ErrorIcon />{errors.temperatureRange}</div>}
            <div className="setting-help">
              Add the temperature requirements to display during check-in via mobile app.
              Note: a temperature violation will not block the driver from completing check-in.
            </div>
          </div>
        </div>

        <div className="setting">
          <div className="toggle-col">
            <Toggle checked={settings.earlyCheckInEnabled} ariaLabel="Early Check In Step"
              onChange={(v) => handleToggle('earlyCheckInEnabled', v, ['earlyCheckInHours', 'earlyCheckInInstruction'])} />
          </div>
          <div className="content-col">
            <div className="setting-name">Early Check In Step</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 6 }}>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', paddingTop: 9 }}>
                Allowed Early Hours:
              </label>
              <div>
                <input className={`form-input ${errors.earlyCheckInHours ? 'err' : ''}`} type="text"
                  placeholder="e.g., 2" style={{ width: 80, marginTop: 0 }}
                  value={settings.earlyCheckInHours}
                  disabled={!settings.earlyCheckInEnabled}
                  onChange={(e) => setLocal('earlyCheckInHours', e.target.value)}
                  onBlur={(e) => handleBlur('earlyCheckInHours', e.target.value, settings.earlyCheckInEnabled)} />
                {errors.earlyCheckInHours && <div className="form-error"><ErrorIcon />{errors.earlyCheckInHours}</div>}
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Early Check In Instruction:
              </label>
            </div>
            <textarea className={`form-textarea ${errors.earlyCheckInInstruction ? 'err' : ''}`}
              value={settings.earlyCheckInInstruction}
              disabled={!settings.earlyCheckInEnabled}
              onChange={(e) => setLocal('earlyCheckInInstruction', e.target.value)}
              onBlur={(e) => handleBlur('earlyCheckInInstruction', e.target.value, settings.earlyCheckInEnabled)} />
            {errors.earlyCheckInInstruction && <div className="form-error"><ErrorIcon />{errors.earlyCheckInInstruction}</div>}
            <div className="setting-help">
              This instruction will be displayed to the driver in the mobile app if the early check-in hours limit is violated.
            </div>
          </div>
        </div>

        <div className="setting">
          <div className="toggle-col">
            <Toggle checked={settings.confirmationEnabled} ariaLabel="Confirmation Step"
              onChange={(v) => handleToggle('confirmationEnabled', v, ['confirmationText'])} />
          </div>
          <div className="content-col">
            <div className="setting-name">Confirmation Step</div>
            <div style={{ marginTop: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Successful Check In Confirmation Text:
              </label>
            </div>
            <textarea className={`form-textarea ${errors.confirmationText ? 'err' : ''}`}
              value={settings.confirmationText}
              disabled={!settings.confirmationEnabled}
              onChange={(e) => setLocal('confirmationText', e.target.value)}
              onBlur={(e) => handleBlur('confirmationText', e.target.value, settings.confirmationEnabled)} />
            {errors.confirmationText && <div className="form-error"><ErrorIcon />{errors.confirmationText}</div>}
            <div className="setting-help">
              This message is displayed to the driver in the mobile app upon successful check-in completion.
            </div>
          </div>
        </div>
      </div>

      {qr && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setQr(null) }}>
          <div className="modal-box" role="dialog" aria-modal="true">
            <div className="modal-title">{qr.title}</div>
            <div className="qr-placeholder"><img src={qr.imageDataUrl} alt="QR code for driver check-in access" /></div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.5 }}>
              Scan this QR code to access Driver Check In for this facility.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={savePdf}>Save as PDF</button>
              <button className="btn btn-dark" onClick={printQr}>Print</button>
              <button className="btn btn-secondary" onClick={() => setQr(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
