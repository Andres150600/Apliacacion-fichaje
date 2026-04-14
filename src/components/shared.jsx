import { useState } from 'react'

// ─── Utilidades ───────────────────────────────────────────────────────────────
export const fmt     = d => d ? new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--'
export const fmtDate = d => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'
export const fmtDur  = ms => { if (!ms || ms < 0) return '0h 0m'; return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m` }
export const fmtDurS = ms => {
  if (!ms || ms < 0) return '0h 00m 00s'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`
}
export const today = () => new Date().toISOString().split('T')[0]
export const ini   = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
export const COLORS = ['#c8a96e', '#8fb8a0', '#5b8ec4', '#c0604a', '#9b8ec4', '#c48e5b']

// Calcula ms netos trabajados descontando pausas deducibles
// Almuerzo ≤ 30min → no descuenta. Todo lo demás → descuenta siempre.
export function calcNetMs(fichajeHoy, pausas, pausaActiva, now) {
  if (!fichajeHoy?.entrada) return 0
  const base   = pausaActiva ? new Date(pausaActiva.inicio) : now
  const bruto  = base - new Date(fichajeHoy.entrada)
  const deducido = (pausas || []).filter(p => p.fin).reduce((acc, p) => {
    const dur = new Date(p.fin) - new Date(p.inicio)
    if ((p.tipo === 'Almuerzo' || p.tipo === 'Comida') && dur <= 30 * 60000) return acc
    return acc + dur
  }, 0)
  return Math.max(0, bruto - deducido)
}

// ─── Componentes base ─────────────────────────────────────────────────────────
export function SH({ title, sub, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2, color: 'var(--text)' }}>{title}</h2>
        {sub && <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

export function Av({ name, size = 32, color }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color || 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 'bold', color: 'var(--accent)', flexShrink: 0 }}>
      {ini(name)}
    </div>
  )
}

export function Badge({ label, c }) {
  return (
    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 10, background: `${c}22`, color: c, border: `1px solid ${c}44`, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

export function Btn({ label, onClick, ghost, disabled, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? 'var(--surface2)' : danger ? 'var(--danger)' : ghost ? 'transparent' : 'var(--accent)',
        color: disabled ? 'var(--muted)' : danger ? '#fff' : ghost ? 'var(--muted)' : '#0f0f0f',
        padding: '7px 14px', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
        fontWeight: 'bold', borderRadius: 4,
        border: ghost ? '1px solid var(--border)' : disabled ? '1px solid var(--border)' : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1
      }}
    >
      {label}
    </button>
  )
}

export function Tabla({ cols, children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--accent)' }}>
            {cols.map(c => <th key={c} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 'normal' }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Empty({ txt }) {
  return <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>{txt}</div>
}

export function Loading() {
  return <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)', fontSize: 12 }}>Cargando...</div>
}

// ─── TopBar (mobile) ──────────────────────────────────────────────────────────
// Para admin: solo muestra nombre + dark toggle
// Para empleado: muestra contador + pausa + salida + dark toggle
export function TopBar({ user, dark, toggleDark, onLogout, isAdmin, netMs, pausaActiva, fichajeHoy, onPausar, onReanudar, onSalida }) {
  return (
    <div className="mobile-top" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Av name={user.nombre} size={28} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 'bold' }}>{user.nombre.split(' ')[0]}</div>
          {isAdmin && <span style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: 2 }}>ADMIN</span>}
        </div>
      </div>
      {!isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: pausaActiva ? 'var(--accent)' : fichajeHoy?.entrada && !fichajeHoy?.salida ? 'var(--accent2)' : 'var(--muted)', fontWeight: 'bold', minWidth: 90, textAlign: 'right' }}>
            {fmtDurS(netMs)}
          </div>
          {fichajeHoy?.entrada && !fichajeHoy?.salida && (
            pausaActiva
              ? <button onClick={onReanudar} style={btnStyle('var(--accent)')} title="Reanudar">▶ Reanudar</button>
              : <button onClick={onPausar}   style={btnStyle('var(--accent)')} title="Pausa">⏸ Pausa</button>
          )}
          {fichajeHoy?.entrada && !fichajeHoy?.salida && (
            <button onClick={onSalida} style={btnStyle('var(--danger)')} title="Fichar salida">⏏ Salida</button>
          )}
        </div>
      )}
      <button onClick={toggleDark} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', borderRadius: 12, fontSize: 11, flexShrink: 0 }}>{dark ? '☀' : '☾'}</button>
    </div>
  )
}

function btnStyle(bg) {
  return { background: bg, color: bg === 'var(--accent)' ? '#0f0f0f' : '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase' }
}

export function PinModal({ titulo, onConfirm, onCancel }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')

  function confirmar() {
    if (!pin) { setErr('Introduce tu PIN'); return }
    onConfirm(pin)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 28, width: '100%', maxWidth: 340 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Confirmar acción</div>
        <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 20 }}>{titulo}</div>
        <label style={{ fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Tu PIN</label>
        <input type='password' value={pin} onChange={e => { setPin(e.target.value); setErr('') }} onKeyDown={e => e.key === 'Enter' && confirmar()} placeholder='••••' maxLength={6} autoFocus style={{ marginBottom: 8 }} />
        {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Btn label='Confirmar' onClick={confirmar} />
          <Btn label='Cancelar' ghost onClick={onCancel} />
        </div>
      </div>
    </div>
  )
}
