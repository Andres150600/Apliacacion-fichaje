// Utilidades
export const fmt = d => d ? new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--'
export const fmtDate = d => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'
export const fmtDur = ms => { if (!ms || ms < 0) return '0h 0m'; return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m` }
export const today = () => new Date().toISOString().split('T')[0]
export const ini = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
export const COLORS = ['#c8a96e', '#8fb8a0', '#5b8ec4', '#c0604a', '#9b8ec4', '#c48e5b']

// Componentes compartidos
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

export function Btn({ label, onClick, ghost }) {
  return (
    <button onClick={onClick} style={{ background: ghost ? 'var(--surface2)' : 'var(--accent)', color: ghost ? 'var(--muted)' : '#0f0f0f', padding: '7px 14px', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 'bold', borderRadius: 4, border: ghost ? '1px solid var(--border)' : 'none' }}>
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

export function TopBar({ user, dark, toggleDark, onLogout, isAdmin, checkedIn }) {
  return (
    <div className="mobile-top" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Av name={user.nombre} size={28} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 'bold' }}>{user.nombre.split(' ')[0]}</div>
          {!isAdmin && checkedIn !== undefined && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: checkedIn ? 'rgba(143,184,160,0.2)' : 'rgba(128,128,128,0.1)', color: checkedIn ? 'var(--accent2)' : 'var(--muted)', border: `1px solid ${checkedIn ? 'var(--accent2)' : 'var(--border)'}` }}>
              {checkedIn ? 'En oficina' : 'Fuera'}
            </span>
          )}
          {isAdmin && <span style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: 2 }}>ADMIN</span>}
        </div>
      </div>
      <button onClick={toggleDark} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', borderRadius: 12, fontSize: 11 }}>{dark ? '☀' : '☾'}</button>
    </div>
  )
}
