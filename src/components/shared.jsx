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

// Cuenta días laborables (lun-vie) en un rango de fechas
export function diasLaborables(desde, hasta) {
  let count = 0
  for (let d = new Date(desde); d <= new Date(hasta); d.setDate(d.getDate() + 1)) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return count
}

// ── Festivos nacionales de España ─────────────────────────────────────────────
// Calcula la fecha de Pascua (algoritmo de Butcher)
function _pascua(anio) {
  const a = anio % 19, b = Math.floor(anio / 100), c = anio % 100
  const d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(anio, mes - 1, dia)
}
function _addDias(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function _fmt(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

export function festivosNacionales(anio) {
  const pascua = _pascua(anio)
  return [
    { fecha: `${anio}-01-01`, nombre: 'Año Nuevo',                  tipo: 'nacional' },
    { fecha: `${anio}-01-06`, nombre: 'Reyes Magos',                tipo: 'nacional' },
    { fecha: _fmt(_addDias(pascua, -3)), nombre: 'Jueves Santo',    tipo: 'nacional' },
    { fecha: _fmt(_addDias(pascua, -2)), nombre: 'Viernes Santo',   tipo: 'nacional' },
    { fecha: `${anio}-05-01`, nombre: 'Día del Trabajo',            tipo: 'nacional' },
    { fecha: `${anio}-08-15`, nombre: 'Asunción de la Virgen',      tipo: 'nacional' },
    { fecha: `${anio}-10-12`, nombre: 'Fiesta Nacional de España',  tipo: 'nacional' },
    { fecha: `${anio}-11-01`, nombre: 'Todos los Santos',           tipo: 'nacional' },
    { fecha: `${anio}-12-06`, nombre: 'Día de la Constitución',     tipo: 'nacional' },
    { fecha: `${anio}-12-08`, nombre: 'Inmaculada Concepción',      tipo: 'nacional' },
    { fecha: `${anio}-12-25`, nombre: 'Navidad',                    tipo: 'nacional' },
  ]
}
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

// ─── NavToggle ────────────────────────────────────────────────────────────────
// options: [{ v: 'timeline', l: '⊟ Timeline' }, ...]
export function NavToggle({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {options.map(({ v, l }) => (
        <button key={v} onClick={() => onChange(v)} style={{ padding: '5px 12px', fontSize: 10, letterSpacing: 1, fontWeight: 'bold', textTransform: 'uppercase', background: value === v ? 'var(--accent)' : 'transparent', color: value === v ? '#0f0f0f' : 'var(--muted)', border: 'none', cursor: 'pointer' }}>
          {l}
        </button>
      ))}
    </div>
  )
}

// ─── MesNav ───────────────────────────────────────────────────────────────────
const _MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function MesNav({ mes, anio, onChange }) {
  const prev = () => { const d = new Date(anio, mes - 1); onChange(d.getMonth(), d.getFullYear()) }
  const next = () => { const d = new Date(anio, mes + 1); onChange(d.getMonth(), d.getFullYear()) }
  const btn  = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 14px', borderRadius: 'var(--r2)', cursor: 'pointer', fontSize: 14 }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button onClick={prev} style={btn}>←</button>
      <div style={{ fontSize: 15, fontWeight: 'bold' }}>{_MESES[mes]} {anio}</div>
      <button onClick={next} style={btn}>→</button>
    </div>
  )
}

// ─── safeUrl (XSS: solo permite http/https) ───────────────────────────────────
export function safeUrl(url) {
  if (!url || typeof url !== 'string') return null
  const u = url.trim()
  return u.startsWith('https://') || u.startsWith('http://') ? u : null
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
