import { useEffect, useState } from 'react'

// Simulates the driver-facing mobile check-in flow (Flow 10).
// Reads only the ENABLED settings from the public mobile endpoint and walks
// the driver through identity → toggled steps → confirmation.

export default function MobilePreview() {
  const [config, setConfig] = useState(null)
  const [step, setStep] = useState(0)        // 0..(steps.length+2)
  const [form, setForm] = useState({})
  const [tempAck, setTempAck] = useState(false)
  const [carrierAck, setCarrierAck] = useState(false)
  const [arrivalEarly, setArrivalEarly] = useState(false)

  const reload = () => {
    fetch('/api/mobile/settings').then(r => r.json()).then((d) => {
      setConfig(d); setStep(0); setForm({}); setTempAck(false); setCarrierAck(false); setArrivalEarly(false)
    })
  }
  useEffect(() => { reload() }, [])

  if (!config) return <div style={{ padding: 40 }}>Loading…</div>

  // Build linear flow: [identity, ...steps, confirmation]
  const flow = [
    { kind: 'identity' },
    ...config.steps.map(s => ({ kind: s.key, data: s })),
    ...(config.confirmation ? [{ kind: 'confirmation' }] : []),
  ]
  const current = flow[step] || flow[flow.length - 1]
  const last = step >= flow.length - 1

  const next = () => setStep((s) => Math.min(s + 1, flow.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  // Early check-in violation interrupts regular flow
  const earlyStep = config.steps.find(s => s.key === 'earlyCheckIn')
  if (current.kind === 'earlyCheckIn' && arrivalEarly) {
    return (
      <MobileFrame title={config.organizationName} onReload={reload}>
        <div className="m-step">
          <div className="m-step-title">Early Arrival</div>
          <div className="m-warning">
            ⚠ {earlyStep?.instruction?.replace('{TRAFFIC_CLERK_PHONE}', '(920) 555-0142')}
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: 14 }} onClick={() => setArrivalEarly(false)}>
            Back
          </button>
        </div>
      </MobileFrame>
    )
  }

  return (
    <MobileFrame title={config.organizationName} onReload={reload}>
      <div className="m-progress">Step {step + 1} of {flow.length}</div>

      {current.kind === 'identity' && (
        <div className="m-step">
          <div className="m-step-title">Driver Identity</div>
          {config.fields.map((f) => (
            <div key={f.key} style={{ marginBottom: 10 }}>
              <label className="m-label">{f.label}{f.required && <span style={{ color: 'var(--s-critical)' }}> *</span>}</label>
              <input className="form-input" value={form[f.key] || ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            </div>
          ))}
        </div>
      )}

      {current.kind === 'carrierApproval' && (
        <div className="m-step">
          <div className="m-step-title">Carrier Approval</div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Please confirm your carrier is approved for delivery at this facility.
          </p>
          <label className="m-checkbox">
            <input type="checkbox" checked={carrierAck} onChange={(e) => setCarrierAck(e.target.checked)} />
            I confirm my carrier is approved
          </label>
        </div>
      )}

      {current.kind === 'temperatureAck' && (
        <div className="m-step">
          <div className="m-step-title">Temperature Acknowledgement</div>
          <div className="m-info">Required temperature range: <strong>{current.data.range || '(not set)'}</strong></div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
            Note: a temperature violation will not block check-in.
          </p>
          <label className="m-checkbox">
            <input type="checkbox" checked={tempAck} onChange={(e) => setTempAck(e.target.checked)} />
            I acknowledge the temperature requirement
          </label>
        </div>
      )}

      {current.kind === 'earlyCheckIn' && !arrivalEarly && (
        <div className="m-step">
          <div className="m-step-title">Arrival Time Check</div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Are you arriving more than <strong>{current.data.hours || '?'}</strong> hours before your appointment?
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setArrivalEarly(true)}>Yes</button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={next}>No</button>
          </div>
        </div>
      )}

      {current.kind === 'confirmation' && (
        <div className="m-step">
          <div className="m-success-icon">✓</div>
          <div className="m-step-title" style={{ textAlign: 'center' }}>Check In Complete</div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 10 }}>
            {config.confirmation}
          </p>
        </div>
      )}

      {/* Nav buttons */}
      {current.kind !== 'earlyCheckIn' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          {step > 0 && current.kind !== 'confirmation' && (
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={back}>Back</button>
          )}
          {!last && current.kind !== 'earlyCheckIn' && (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={next}
              disabled={
                (current.kind === 'temperatureAck' && !tempAck) ||
                (current.kind === 'carrierApproval' && !carrierAck)
              }>
              Continue
            </button>
          )}
          {last && (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={reload}>Start Over</button>
          )}
        </div>
      )}
    </MobileFrame>
  )
}

function MobileFrame({ title, children, onReload }) {
  return (
    <div>
      <div className="toolbar">
        <span className="page-title">Mobile Check-In Preview</span>
        <button className="btn btn-secondary" style={{ height: 28 }} onClick={onReload}>↻ Reload Settings</button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
        Simulates the driver-facing mobile app — reflects whatever toggles are currently ON in admin.
      </p>
      <div className="phone">
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="m-header">
            <div className="m-org">{title}</div>
            <div className="m-sub">Driver Check In</div>
          </div>
          <div className="m-body">{children}</div>
        </div>
      </div>
    </div>
  )
}
