import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'

export default function Login({ onLogin, toast, dark, toggleDark }) {
  const [emps, setEmps] = useState([])
  const [sel, setSel] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    sb.from('empleados').select('id,nombre,es_admin').eq('activo', true).order('nombre')
      .then(({ data }) => setEmps(data || []))
  }, [])

  async function acceder() {
    if (!sel) { setErr('Selecciona un empleado'); return }
    if (!pin) { setErr('Introduce tu PIN'); return }
    setLoading(true); setErr('')
    const { data, error } = await sb.rpc('verificar_pin', { p_id: sel, p_pin: pin })
    setLoading(false)
    if (error) { setErr('Error de conexión'); return }
    if (!data?.ok) { setErr(data?.bloqueado ? 'Cuenta bloqueada 15 min por exceso de intentos' : 'PIN incorrecto'); setPin(''); return }
    onLogin({ ...data.empleado, _pin: pin })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={toggleDark} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', borderRadius: 20, fontSize: 12 }}>{dark ? '☀ Claro' : '☾ Oscuro'}</button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase' }}>Sistema de fichaje</div>
          <h1 style={{ fontSize: 32, fontWeight: 'normal', letterSpacing: 3, color: 'var(--text)' }}>WorkClock</h1>
          <div style={{ width: 40, height: 1, background: 'var(--accent)', margin: '12px auto 8px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 12 }}>Control de presencia empresarial</p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 28 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Empleado</label>
            <select value={sel} onChange={e => setSel(e.target.value)}>
              <option value=''>-- Seleccionar --</option>
              {emps.map(e => <option key={e.id} value={e.id}>{e.nombre}{e.es_admin ? ' (Admin)' : ''}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>PIN</label>
            <input type='password' value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && acceder()} placeholder='••••' maxLength={6} />
          </div>
          {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>{err}</div>}
          <button onClick={acceder} disabled={loading} style={{ width: '100%', padding: 11, background: 'var(--accent)', color: '#0f0f0f', fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase', fontSize: 12, borderRadius: 4 }}>
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </div>
      </div>
    </div>
  )
}
