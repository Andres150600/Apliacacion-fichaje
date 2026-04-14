import { useState } from 'react'
import { api } from '../lib/api'

export default function Login({ onLogin, toast, dark, toggleDark }) {
  const [nombre, setNombre] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function acceder() {
    if (!nombre.trim()) { setErr('Introduce tu nombre'); return }
    if (!pin) { setErr('Introduce tu PIN'); return }
    setLoading(true); setErr('')
    try {
      const { token, empleado } = await api.login(nombre.trim(), pin)
      onLogin(empleado, token)
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('bloqueado') || msg.includes('bloque')) {
        setErr('Cuenta bloqueada 15 min por exceso de intentos')
      } else {
        setErr('Credenciales incorrectas'); setPin('')
      }
    } finally {
      setLoading(false)
    }
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
            <label style={{ fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nombre</label>
            <input type='text' value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={e => e.key === 'Enter' && acceder()} placeholder='Tu nombre completo' autoComplete='off' />
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
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ color: 'var(--accent)', fontSize: 13, flexShrink: 0 }}>⚠</span>
          <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
            En equipos compartidos, recuerda <strong style={{ color: 'var(--text)' }}>cerrar sesión</strong> al terminar. La sesión expira automáticamente a las 8 horas.
          </p>
        </div>
      </div>
    </div>
  )
}
