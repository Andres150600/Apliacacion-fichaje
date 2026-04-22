import { useState, useEffect, useCallback } from 'react'
import ExcelJS from 'exceljs'
import { api } from '../lib/api'
import { SH, Av, Badge, Btn, Tabla, Empty, Loading, TopBar, fmt, fmtDate, fmtDur, today, COLORS, festivosNacionales } from './shared'

export default function Admin({ user, token, onLogout, toast, dark, toggleDark }) {
  const [tab, setTab] = useState(() => localStorage.getItem('wc_admin_tab') || 'dashboard')

  const cambiarTab = t => { localStorage.setItem('wc_admin_tab', t); setTab(t) }
  const [pend, setPend] = useState(0)
  const [nAlertas, setNAlertas] = useState(0)

  useEffect(() => {
    api.getAusencias(token, { estado: 'pendiente' }).then(d => setPend(d.length)).catch(() => {})
    api.getAlertas(token).then(d => setNAlertas(d.filter(a => a.tipo === 'sin_salida').length)).catch(() => {})
  }, [token])

  const tabs = [
    { id: 'dashboard', icon: '▦', label: 'Panel' },
    { id: 'fichajes',  icon: '◷', label: 'Fichajes' },
    { id: 'ausencias', icon: '◌', label: 'Ausencias' },
    { id: 'empleados', icon: '◉', label: 'Equipo' },
    { id: 'turnos',    icon: '◑', label: 'Turnos' },
    { id: 'festivos',  icon: '◈', label: 'Festivos' },
    { id: 'informes',   icon: '▤', label: 'Informes' },
    { id: 'alertas',    icon: '▲', label: 'Alertas' },
    { id: 'documentos', icon: '▣', label: 'Docs' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="desktop-sidebar" style={{ width: 190, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '22px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: 'var(--accent)', marginBottom: 3, textTransform: 'uppercase' }}>Admin</div>
            <div style={{ fontSize: 14, fontWeight: 'bold' }}>{user.nombre.split(' ')[0]}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{user.departamento}</div>
          </div>
          <button onClick={toggleDark} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: 12, fontSize: 11 }}>{dark ? '☀' : '☾'}</button>
        </div>
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => cambiarTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 18px', background: tab === t.id ? 'var(--surface2)' : 'transparent', color: tab === t.id ? 'var(--accent)' : 'var(--muted)', textAlign: 'left', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', borderLeft: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent', borderRight: 'none', borderTop: 'none', borderBottom: 'none' }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
              {t.id === 'ausencias' && pend > 0 && <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px', marginLeft: 'auto' }}>{pend}</span>}
              {t.id === 'alertas' && nAlertas > 0 && <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px', marginLeft: 'auto' }}>{nAlertas}</span>}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} style={{ padding: '13px 18px', background: 'transparent', color: 'var(--muted)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'left', borderTop: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>Cerrar sesión</button>
      </aside>
      <main className="main-pad" style={{ flex: 1, overflow: 'auto', padding: 26, background: 'var(--bg)' }}>
        <TopBar user={user} dark={dark} toggleDark={toggleDark} onLogout={onLogout} isAdmin={true} />
        {tab === 'dashboard' && <AdminDashboard token={token} />}
        {tab === 'fichajes'  && <AdminFichajes token={token} toast={toast} />}
        {tab === 'ausencias' && <AdminAusencias token={token} toast={toast} />}
        {tab === 'empleados' && <AdminEmpleados token={token} toast={toast} />}
        {tab === 'turnos'    && <AdminTurnos token={token} toast={toast} />}
        {tab === 'festivos'  && <AdminFestivos token={token} toast={toast} />}
        {tab === 'informes'  && <AdminInformes token={token} toast={toast} />}
        {tab === 'alertas'    && <AdminAlertas token={token} />}
        {tab === 'documentos' && <AdminDocumentos token={token} toast={toast} />}
      </main>
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {tabs.map(t => (
            <button key={t.id} className={`bnav-item${tab === t.id ? ' active' : ''}`} onClick={() => cambiarTab(t.id)}>
              {t.id === 'ausencias' && pend > 0 && <span className="nbadge">{pend}</span>}
              {t.id === 'alertas' && nAlertas > 0 && <span className="nbadge">{nAlertas}</span>}
              <span className="bnav-icon">{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
          <button className="bnav-item" onClick={onLogout}><span className="bnav-icon">⏏</span><span>Salir</span></button>
        </div>
      </nav>
    </div>
  )
}

// ─── Iconos SVG inline ────────────────────────────────────────────────────────
function Icon({ d, size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke={color} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
      <path d={d} />
    </svg>
  )
}
const IC = {
  team:    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  clock:   'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2',
  check:   'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  warning: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
}

function StatCard({ label, value, icon, color, sub, pulse }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 12,
      border: '1px solid var(--border)', borderTop: `3px solid ${color}`,
      padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold', lineHeight: 1.4 }}>
          {label}
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon d={icon} size={17} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 38, fontWeight: 'bold', color, lineHeight: 1, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {pulse && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', animation: 'pulse 2s infinite' }} />}
        {sub}
      </div>
    </div>
  )
}

function AdminDashboard({ token }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    api.getDashboard(token).then(setData).catch(() => {})
  }, [token])

  if (!data) return <Loading />
  const { stats, semana, departamentos, recientes } = data
  const mx      = Math.max(...semana.map(s => s.n), 1)
  const maxDept = Math.max(...departamentos.map(x => x[1]), 1)
  const hoyIdx  = (new Date().getDay() + 6) % 7  // lun=0 … dom=6

  const statCards = [
    { label: 'Empleados',    value: stats.empleados,    icon: IC.team,    color: 'var(--info)',    sub: 'en plantilla' },
    { label: 'Fichajes hoy', value: stats.fichajes_hoy, icon: IC.clock,   color: 'var(--accent)',  sub: 'entradas registradas hoy' },
    { label: 'En oficina',   value: stats.en_oficina,   icon: IC.check,   color: 'var(--accent2)', sub: 'trabajando ahora', pulse: stats.en_oficina > 0 },
    { label: 'Pendientes',   value: stats.pendientes,   icon: IC.warning, color: stats.pendientes > 0 ? 'var(--danger)' : 'var(--muted)', sub: 'ausencias por revisar' },
  ]

  return (
    <div>
      <SH title='Panel de control' sub={fmtDate(new Date())} />

      {/* ── Stat cards ── */}
      <div className='stat-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
        {statCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* ── Semana + Departamentos ── */}
      <div className='week-dept-grid' style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 22 }}>

        {/* Gráfico semanal */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Fichajes esta semana</div>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 'bold' }}>
              {semana.reduce((a, s) => a + s.n, 0)} total
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
            {semana.map((s, i) => {
              const esHoy = i === hoyIdx
              const h     = Math.round((s.n / mx) * 72) + 6
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {s.n > 0 && (
                    <span style={{ fontSize: 10, color: esHoy ? 'var(--accent)' : 'var(--muted)', fontWeight: esHoy ? 'bold' : 'normal' }}>{s.n}</span>
                  )}
                  <div style={{
                    width: '100%', height: `${h}px`, minHeight: 6, borderRadius: '4px 4px 2px 2px',
                    background: s.n === 0 ? 'var(--surface2)' : esHoy ? 'var(--accent)' : 'var(--accent)44',
                    boxShadow: esHoy && s.n > 0 ? '0 0 8px var(--accent)66' : 'none',
                    transition: 'height 0.3s ease',
                  }} />
                  <span style={{ fontSize: 10, color: esHoy ? 'var(--accent)' : 'var(--muted)', fontWeight: esHoy ? 'bold' : 'normal' }}>{s.d}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Departamentos */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', marginBottom: 18, textTransform: 'uppercase', fontWeight: 'bold' }}>Por departamento</div>
          {departamentos.length === 0 && <Empty txt='Sin datos' />}
          {departamentos.map(([d, n], i) => (
            <div key={d} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 'bold' }}>{d}</span>
                <span style={{ fontSize: 11, color: COLORS[i % COLORS.length], fontWeight: 'bold' }}>{n}</span>
              </div>
              <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: COLORS[i % COLORS.length], width: `${(n / maxDept) * 100}%`, borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actividad reciente ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Actividad reciente</div>
          <Badge label={`${recientes.length} registros`} c='var(--accent)' />
        </div>
        {recientes.length === 0 ? (
          <div style={{ padding: 20 }}><Empty txt='Sin actividad' /></div>
        ) : recientes.map((r, i) => {
          const completo = !!r.salida
          const dur      = completo ? fmtDur(new Date(r.salida) - new Date(r.entrada)) : null
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < recientes.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <Av name={r.empleados?.nombre || '?'} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.empleados?.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{fmtDate(r.fecha)}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--accent2)', fontVariantNumeric: 'tabular-nums' }}>↑ {fmt(r.entrada)}</span>
                {r.salida
                  ? <span style={{ fontSize: 12, color: 'var(--danger)', fontVariantNumeric: 'tabular-nums' }}>↓ {fmt(r.salida)}</span>
                  : <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>
                }
                {dur
                  ? <Badge label={dur} c='var(--accent2)' />
                  : <Badge label='En curso' c='var(--accent)' />
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Timeline helpers ─────────────────────────────────────────────────────────
const TL_START  = 6 * 60    // 06:00
const TL_END    = 22 * 60   // 22:00
const TL_RANGE  = TL_END - TL_START
const TL_TICKS  = [6, 9, 12, 15, 18, 21]

function toMin(isoStr) {
  if (!isoStr) return null
  const d = new Date(isoStr)
  return d.getHours() * 60 + d.getMinutes()
}
function toPct(min) {
  return `${Math.max(0, Math.min(100, ((min - TL_START) / TL_RANGE) * 100)).toFixed(2)}%`
}

function FichajeCard({ r }) {
  const entMin  = toMin(r.entrada)
  const salMin  = r.salida ? toMin(r.salida) : toMin(new Date().toISOString())
  const enCurso = !r.salida
  const dur     = r.salida ? fmtDur(new Date(r.salida) - new Date(r.entrada))
                           : fmtDur(Date.now() - new Date(r.entrada))
  const barLeft  = entMin != null ? toPct(entMin) : '0%'
  const barWidth = (entMin != null && salMin != null)
    ? `${Math.max(0.8, Math.min(100, ((salMin - entMin) / TL_RANGE) * 100)).toFixed(2)}%`
    : '0.8%'

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Av name={r.empleados?.nombre || '?'} size={30} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', lineHeight: 1.2 }}>{r.empleados?.nombre}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{dur}</span>
          <Badge
            label={enCurso ? 'En curso' : 'Completo'}
            c={enCurso ? 'var(--accent)' : 'var(--accent2)'}
          />
        </div>
      </div>

      {/* Visual timeline bar */}
      <div style={{ position: 'relative', height: 22, marginBottom: 6, borderRadius: 6, overflow: 'hidden', background: 'var(--surface2)' }}>
        {/* Tick lines */}
        {TL_TICKS.map(h => (
          <div key={h} style={{ position: 'absolute', left: toPct(h * 60), top: 0, bottom: 0, width: 1, background: 'var(--border)', opacity: 0.6 }} />
        ))}
        {/* Work segment */}
        {entMin != null && (
          <div style={{
            position: 'absolute', left: barLeft, width: barWidth, top: 3, bottom: 3, borderRadius: 4,
            background: enCurso ? 'var(--accent)' : '#4caf84',
            opacity: enCurso ? 0.9 : 1,
            boxShadow: enCurso ? '0 0 6px var(--accent)' : 'none',
          }} />
        )}
        {/* "Sin salida" red right edge */}
        {enCurso && entMin != null && (
          <div style={{ position: 'absolute', right: 0, top: 3, bottom: 3, width: 4, borderRadius: 4, background: 'var(--danger)', opacity: 0.5 }} />
        )}
      </div>

      {/* Hour labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--muted)', letterSpacing: 0.5, marginBottom: 10 }}>
        {TL_TICKS.map(h => <span key={h}>{String(h).padStart(2, '0')}h</span>)}
      </div>

      {/* Entry / exit pills */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent2)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--accent2)', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>↑ {fmt(r.entrada)}</span>
        </div>
        {r.salida ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--danger)', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>↓ {fmt(r.salida)}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', opacity: 0.5, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sin salida registrada</span>
          </div>
        )}
      </div>
    </div>
  )
}

function DaySection({ fecha, rows }) {
  const complete   = rows.filter(r => r.salida).length
  const inProgress = rows.filter(r => !r.salida).length
  const totalMs    = rows.filter(r => r.salida).reduce((acc, r) => acc + (new Date(r.salida) - new Date(r.entrada)), 0)

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--accent)', color: '#0f0f0f', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 }}>
          {fmtDate(fecha)}
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{rows.length} empleado{rows.length !== 1 ? 's' : ''}</span>
        {complete > 0    && <Badge label={`${complete} completo${complete > 1 ? 's' : ''}`}  c='var(--accent2)' />}
        {inProgress > 0  && <Badge label={`${inProgress} en curso`}                           c='var(--accent)'  />}
        {totalMs > 0     && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>{fmtDur(totalMs)} totales</span>}
      </div>
      {rows.map(r => <FichajeCard key={r.id} r={r} />)}
    </div>
  )
}

// ─── AdminFichajes ────────────────────────────────────────────────────────────
function AdminFichajes({ token, toast }) {
  const [rows, setRows] = useState([])
  const [emps, setEmps] = useState([])
  const [fE, setFE] = useState('')
  const [fF, setFF] = useState('')
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('timeline')

  useEffect(() => {
    api.getEmpleadosAdmin(token).then(setEmps).catch(() => {})
  }, [token])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (fE) params.empleado_id = fE
    if (fF) params.fecha = fF
    api.getFichajes(token, params).then(d => { setRows(d); setLoading(false) }).catch(() => setLoading(false))
  }, [token, fE, fF])

  async function exportExcel() {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Fichajes')
    ws.columns = [
      { header: 'Empleado', width: 22 }, { header: 'Fecha', width: 12 },
      { header: 'Entrada', width: 10 }, { header: 'Salida', width: 10 },
      { header: 'Total', width: 12 }, { header: 'Estado', width: 12 },
    ]
    rows.forEach(r => ws.addRow([r.empleados?.nombre || '-', r.fecha, fmt(r.entrada), r.salida ? fmt(r.salida) : '-', r.salida ? fmtDur(new Date(r.salida) - new Date(r.entrada)) : 'En curso', r.salida ? 'Completo' : 'En curso']))
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `fichajes_${today()}.xlsx`; a.click()
    URL.revokeObjectURL(url)
    toast('Excel descargado')
  }

  const byDate = {}
  rows.forEach(r => {
    if (!byDate[r.fecha]) byDate[r.fecha] = []
    byDate[r.fecha].push(r)
  })
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <SH title='Registro de fichajes' sub={`${rows.length} registros`}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn label='↓ Excel' onClick={exportExcel} ghost />
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 4, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {[{ v: 'timeline', l: '⊟ Timeline' }, { v: 'tabla', l: '⊞ Tabla' }].map(({ v, l }) => (
              <button key={v} onClick={() => setVista(v)} style={{ padding: '5px 12px', fontSize: 10, letterSpacing: 1, fontWeight: 'bold', textTransform: 'uppercase', background: vista === v ? 'var(--accent)' : 'transparent', color: vista === v ? '#0f0f0f' : 'var(--muted)', border: 'none', cursor: 'pointer' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </SH>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={fE} onChange={e => setFE(e.target.value)} style={{ width: 200 }}>
          <option value=''>Todos los empleados</option>
          {emps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <input type='date' value={fF} onChange={e => setFF(e.target.value)} style={{ width: 160 }} />
        {(fE || fF) && <Btn label='Limpiar' ghost onClick={() => { setFE(''); setFF('') }} />}
      </div>

      {loading ? <Loading /> : rows.length === 0 ? <Empty txt='No hay fichajes' /> : vista === 'timeline' ? (
        <div>
          {dates.map(fecha => <DaySection key={fecha} fecha={fecha} rows={byDate[fecha]} />)}
        </div>
      ) : (
        <Tabla cols={['Empleado', 'Fecha', 'Entrada', 'Salida', 'Total', 'Estado']}>
          {rows.map(r => {
            const dur = r.salida ? fmtDur(new Date(r.salida) - new Date(r.entrada)) : null
            return (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '9px 10px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Av name={r.empleados?.nombre || '?'} size={22} /><span style={{ fontSize: 13 }}>{r.empleados?.nombre}</span></div></td>
                <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--muted)' }}>{fmtDate(r.fecha)}</td>
                <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--accent2)' }}>↑{fmt(r.entrada)}</td>
                <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--danger)' }}>{r.salida ? `↓${fmt(r.salida)}` : '-'}</td>
                <td style={{ padding: '9px 10px', fontSize: 12 }}>{dur || '-'}</td>
                <td style={{ padding: '9px 10px' }}><Badge label={r.salida ? 'Completo' : 'En curso'} c={r.salida ? 'var(--accent2)' : 'var(--accent)'} /></td>
              </tr>
            )
          })}
        </Tabla>
      )}
    </div>
  )
}

// ─── Calendario de ausencias ─────────────────────────────────────────────────
const AUS_COLOR = { aprobada: 'var(--accent2)', pendiente: 'var(--accent)', rechazada: 'var(--danger)' }
const DIAS_CAL  = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MESES_CAL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function CalendarioAusencias({ ausencias, anio, mes }) {
  const daysInMonth = new Date(anio, mes + 1, 0).getDate()
  const firstDay    = (new Date(anio, mes, 1).getDay() + 6) % 7  // lun=0
  const todayStr    = new Date().toISOString().split('T')[0]

  function ausForDay(day) {
    const d = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return ausencias.filter(a => a.desde <= d && a.hasta >= d)
  }

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 3 }}>
        {DIAS_CAL.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: 'var(--muted)', letterSpacing: 1, padding: '5px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`_${i}`} />
          const dateStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const aus     = ausForDay(day)
          const isToday = dateStr === todayStr
          const hasAus  = aus.length > 0
          return (
            <div key={day} style={{
              background: isToday ? 'var(--accent)18' : hasAus ? 'var(--surface2)' : 'transparent',
              border: isToday ? '1px solid var(--accent)55' : '1px solid var(--border)',
              borderRadius: 8, padding: '7px 4px', minHeight: 54,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 12, fontWeight: isToday || hasAus ? 'bold' : 'normal', color: isToday ? 'var(--accent)' : hasAus ? 'var(--text)' : 'var(--muted)' }}>
                {day}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                {aus.slice(0, 3).map((a, j) => {
                  const c = AUS_COLOR[a.estado] || 'var(--muted)'
                  return (
                    <div key={j} title={`${a.empleados?.nombre} · ${a.tipo} · ${a.estado}`} style={{
                      width: 16, height: 16, borderRadius: '50%',
                      background: `${c}25`, border: `1.5px solid ${c}`,
                      fontSize: 7, fontWeight: 'bold', color: c,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {(a.empleados?.nombre || '?')[0].toUpperCase()}
                    </div>
                  )
                })}
                {aus.length > 3 && <span style={{ fontSize: 8, color: 'var(--muted)', alignSelf: 'center' }}>+{aus.length - 3}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── AdminAusencias ───────────────────────────────────────────────────────────
function AdminAusencias({ token, toast }) {
  const [rows, setRows]   = useState([])
  const [vista, setVista] = useState('calendario')
  const now = new Date()
  const [mes, setMes]   = useState(now.getMonth())
  const [anio, setAnio] = useState(now.getFullYear())

  const load = useCallback(() => {
    api.getAusencias(token).then(setRows).catch(() => {})
  }, [token])
  useEffect(load, [load])

  async function cambiar(id, estado) {
    try {
      await api.patchAusencia(token, id, estado)
      toast(estado === 'aprobada' ? 'Aprobada' : 'Rechazada')
      load()
    } catch (e) { toast('Error: ' + e.message, 'err') }
  }

  const pendientes = rows.filter(r => r.estado === 'pendiente')
  const aprobadas  = rows.filter(r => r.estado === 'aprobada')
  const rechazadas = rows.filter(r => r.estado === 'rechazada')

  // Ausencias que tocan el mes visible
  const rowsMes = rows.filter(r => {
    const primerDia = new Date(anio, mes, 1)
    const ultimoDia = new Date(anio, mes + 1, 0)
    return new Date(r.desde) <= ultimoDia && new Date(r.hasta) >= primerDia
  })

  function prevMes() { const d = new Date(anio, mes - 1); setMes(d.getMonth()); setAnio(d.getFullYear()) }
  function nextMes() { const d = new Date(anio, mes + 1); setMes(d.getMonth()); setAnio(d.getFullYear()) }

  return (
    <div>
      <SH title='Ausencias' sub={`${pendientes.length} pendientes`}>
        <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 4, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {[{ v: 'calendario', l: '⊟ Calendario' }, { v: 'lista', l: '⊞ Lista' }].map(({ v, l }) => (
            <button key={v} onClick={() => setVista(v)} style={{ padding: '5px 12px', fontSize: 10, letterSpacing: 1, fontWeight: 'bold', textTransform: 'uppercase', background: vista === v ? 'var(--accent)' : 'transparent', color: vista === v ? '#0f0f0f' : 'var(--muted)', border: 'none', cursor: 'pointer' }}>
              {l}
            </button>
          ))}
        </div>
      </SH>

      {/* Resumen rápido */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { l: 'Pendientes', v: pendientes.length, c: 'var(--accent)'  },
          { l: 'Aprobadas',  v: aprobadas.length,  c: 'var(--accent2)' },
          { l: 'Rechazadas', v: rechazadas.length,  c: 'var(--danger)'  },
        ].map(s => (
          <div key={s.l} style={{ background: 'var(--surface)', border: `1px solid ${s.c}44`, borderRadius: 10, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 'bold', color: s.c, lineHeight: 1 }}>{s.v}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.l}</span>
          </div>
        ))}
      </div>

      {vista === 'calendario' ? (
        <>
          {/* Panel calendario */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <button onClick={prevMes} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>←</button>
              <div style={{ fontSize: 15, fontWeight: 'bold' }}>{MESES_CAL[mes]} {anio}</div>
              <button onClick={nextMes} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>→</button>
            </div>
            <CalendarioAusencias ausencias={rowsMes} anio={anio} mes={mes} />
            <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap' }}>
              {[['aprobada', 'Aprobada'], ['pendiente', 'Pendiente'], ['rechazada', 'Rechazada']].map(([k, l]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: `${AUS_COLOR[k]}25`, border: `1.5px solid ${AUS_COLOR[k]}`, display: 'inline-block' }} />
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Solicitudes pendientes de acción */}
          {pendientes.length > 0 && (
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, fontWeight: 'bold' }}>
                Solicitudes por revisar · {pendientes.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendientes.map(a => (
                  <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--accent)44', borderLeft: '3px solid var(--accent)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <Av name={a.empleados?.nombre || '?'} size={38} />
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{a.empleados?.nombre}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Badge label={a.tipo} c='var(--accent)' />
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(a.desde)} → {fmtDate(a.hasta)}</span>
                        </div>
                        {a.motivo && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontStyle: 'italic' }}>"{a.motivo}"</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => cambiar(a.id, 'aprobada')}  style={{ background: 'var(--accent2)', color: '#0f0f0f', padding: '8px 16px', fontSize: 11, fontWeight: 'bold', borderRadius: 6, border: 'none', cursor: 'pointer', letterSpacing: 0.5 }}>✓ Aprobar</button>
                        <button onClick={() => cambiar(a.id, 'rechazada')} style={{ background: 'transparent', color: 'var(--danger)', padding: '8px 16px', fontSize: 11, fontWeight: 'bold', borderRadius: 6, border: '1px solid var(--danger)', cursor: 'pointer', letterSpacing: 0.5 }}>✗ Rechazar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {rows.length === 0 && <Empty txt='No hay solicitudes' />}
        </>
      ) : (
        <>
          <Tabla cols={['Empleado', 'Tipo', 'Desde', 'Hasta', 'Motivo', 'Estado', '']}>
            {rows.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '9px 10px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Av name={a.empleados?.nombre || '?'} size={22} /><span style={{ fontSize: 13 }}>{a.empleados?.nombre}</span></div></td>
                <td style={{ padding: '9px 10px', fontSize: 12 }}>{a.tipo}</td>
                <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--muted)' }}>{fmtDate(a.desde)}</td>
                <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--muted)' }}>{fmtDate(a.hasta)}</td>
                <td style={{ padding: '9px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.motivo}</td>
                <td style={{ padding: '9px 10px' }}><Badge label={a.estado} c={AUS_COLOR[a.estado] || 'var(--muted)'} /></td>
                <td style={{ padding: '9px 10px' }}>
                  {a.estado === 'pendiente' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => cambiar(a.id, 'aprobada')}  style={{ background: 'var(--accent2)', color: '#0f0f0f', padding: '4px 10px', fontSize: 11, borderRadius: 4, border: 'none', cursor: 'pointer' }}>✓</button>
                      <button onClick={() => cambiar(a.id, 'rechazada')} style={{ background: 'var(--danger)',  color: '#fff',    padding: '4px 10px', fontSize: 11, borderRadius: 4, border: 'none', cursor: 'pointer' }}>✗</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </Tabla>
          {rows.length === 0 && <Empty txt='No hay solicitudes' />}
        </>
      )}
    </div>
  )
}

function AdminEmpleados({ token, toast }) {
  const [emps, setEmps]     = useState([])
  const [turnos, setTurnos] = useState([])
  const [show, setShow]     = useState(false)
  const formVacio = { nombre: '', email: '', cargo: '', departamento: '', pin: '', dias_vacaciones: 25, turno_id: '' }
  const [form, setForm]     = useState(formVacio)

  const load = useCallback(() => {
    Promise.all([api.getEmpleadosAdmin(token), api.getTurnos(token)])
      .then(([e, t]) => { setEmps(e); setTurnos(t) }).catch(() => {})
  }, [token])
  useEffect(load, [load])

  async function guardar() {
    if (!form.nombre || !form.email || !form.pin) { toast('Nombre, email y PIN obligatorios', 'err'); return }
    try {
      const payload = { ...form }
      if (!payload.turno_id) delete payload.turno_id
      await api.postEmpleado(token, payload)
      toast('Empleado añadido')
      setForm(formVacio)
      setShow(false); load()
    } catch (e) { toast('Error: ' + e.message, 'err') }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar empleado?')) return
    try {
      await api.deleteEmpleado(token, id)
      toast('Eliminado'); load()
    } catch (e) { toast('Error: ' + e.message, 'err') }
  }

  return (
    <div>
      <SH title='Empleados' sub={`${emps.length} registrados`}><Btn label='+ Añadir' onClick={() => setShow(!show)} /></SH>
      {show && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 8, padding: 18, marginBottom: 18 }}>
          <div className="mobile-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['nombre', 'Nombre'], ['email', 'Email'], ['cargo', 'Cargo'], ['departamento', 'Departamento'], ['pin', 'PIN']].map(([k, p]) => (
              <input key={k} placeholder={p} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} maxLength={k === 'pin' ? 6 : undefined} />
            ))}
            <input type='number' placeholder='Días vacaciones' value={form.dias_vacaciones} onChange={e => setForm(f => ({ ...f, dias_vacaciones: Number(e.target.value) }))} />
            <div>
              <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>JORNADA</label>
              <select value={form.turno_id} onChange={e => setForm(f => ({ ...f, turno_id: e.target.value }))} style={{ width: '100%' }}>
                <option value=''>Sin jornada asignada</option>
                {turnos.map(t => <option key={t.id} value={t.id}>{t.nombre} ({t.hora_entrada?.slice(0,5)}–{t.hora_salida?.slice(0,5)})</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}><Btn label='Guardar' onClick={guardar} /><Btn label='Cancelar' ghost onClick={() => setShow(false)} /></div>
        </div>
      )}
      <div className="emp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {emps.map((e, i) => {
          const empTurnos = turnos.filter(t => t.empleados?.some(x => x.id === e.id))
          return (
            <div key={e.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Av name={e.nombre} size={34} color={COLORS[i % COLORS.length]} />
                <div><div style={{ fontSize: 14, fontWeight: 'bold' }}>{e.nombre}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{e.cargo}</div></div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{e.departamento} · {e.email}</div>
              <div style={{ marginBottom: 8 }}>
                {empTurnos.length > 0 ? empTurnos.map(t => (
                  <div key={t.id} style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <span>◑</span><span>{t.nombre} · {t.hora_entrada?.slice(0,5)}–{t.hora_salida?.slice(0,5)}</span>
                  </div>
                )) : (
                  <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}><span>◑</span><span>Sin jornada</span></div>
                )}
              </div>
              <div style={{ fontSize: 11, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--accent2)' }}>{e.dias_usados || 0} usados</span>
                <span style={{ color: 'var(--muted)' }}>{(e.dias_vacaciones || 25) - (e.dias_usados || 0)} restantes</span>
              </div>
              <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, marginBottom: 10 }}>
                <div style={{ height: '100%', background: 'var(--accent2)', width: `${Math.min(((e.dias_usados || 0) / (e.dias_vacaciones || 25)) * 100, 100)}%`, borderRadius: 2 }} />
              </div>
              <button onClick={() => eliminar(e.id)} style={{ background: 'transparent', color: 'var(--danger)', fontSize: 11, border: '1px solid var(--danger)', padding: '4px 10px', borderRadius: 4, width: '100%' }}>Eliminar</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const DIAS_SEM = [{ n: 'L', v: 1 }, { n: 'M', v: 2 }, { n: 'X', v: 3 }, { n: 'J', v: 4 }, { n: 'V', v: 5 }, { n: 'S', v: 6 }, { n: 'D', v: 7 }]
const durTurno = (e, s) => { if (!e || !s) return '—'; const [eh,em]=e.split(':').map(Number); const [sh,sm]=s.split(':').map(Number); const d=(sh*60+sm)-(eh*60+em); return d>0?`${Math.floor(d/60)}h${d%60>0?' '+d%60+'m':''}`.trim():'—' }
const nomDias  = d => DIAS_SEM.filter(x=>(d||[]).includes(x.v)).map(x=>x.n).join('·') || '—'

function AdminTurnos({ token, toast }) {
  const [turnos, setTurnos]     = useState([])   // plantillas con .empleados[]
  const [emps, setEmps]         = useState([])   // todos los empleados
  const [editando, setEditando] = useState(null) // null | 'nuevo' | turno
  const [seccion, setSeccion]   = useState('jornadas') // 'jornadas' | 'asignaciones'
  const [seleccion, setSeleccion] = useState({}) // { turno_id: Set<empId> }
  const [guardando, setGuardando] = useState(null) // turno_id guardando
  const formVacio = { nombre: '', hora_entrada: '08:00', hora_salida: '18:00', dias_semana: [1,2,3,4,5] }
  const [form, setForm]         = useState(formVacio)

  const load = useCallback(() => {
    Promise.all([api.getTurnos(token), api.getEmpleadosAdmin(token)])
      .then(([t, e]) => {
        setTurnos(t); setEmps(e)
        // Inicializar selección con los empleados ya asignados a cada jornada
        const sel = {}
        t.forEach(turno => { sel[turno.id] = new Set((turno.empleados || []).map(emp => emp.id)) })
        setSeleccion(sel)
      }).catch(() => {})
  }, [token])
  useEffect(load, [load])

  const toggleDia = v => setForm(f => ({ ...f, dias_semana: f.dias_semana.includes(v) ? f.dias_semana.filter(d => d !== v) : [...f.dias_semana, v].sort((a,b)=>a-b) }))

  async function guardar() {
    if (!form.nombre) { toast('El nombre es obligatorio', 'err'); return }
    try {
      if (editando === 'nuevo') { await api.postTurno(token, form); toast('Jornada creada') }
      else { await api.patchTurno(token, editando.id, form); toast('Jornada actualizada') }
      setEditando(null); load()
    } catch (e) { toast('Error: ' + e.message, 'err') }
  }

  async function eliminar(id) {
    const t = turnos.find(x => x.id === id)
    if (t?.empleados?.length > 0) { toast('Desasigna los empleados antes de eliminar', 'err'); return }
    try { await api.deleteTurno(token, id); toast('Jornada eliminada'); load() }
    catch (e) { toast('Error: ' + e.message, 'err') }
  }

  function toggleEmpSeleccion(turnoId, empId) {
    setSeleccion(prev => {
      const s = new Set(prev[turnoId] || [])
      s.has(empId) ? s.delete(empId) : s.add(empId)
      return { ...prev, [turnoId]: s }
    })
  }

  async function guardarAsignaciones(turnoId) {
    setGuardando(turnoId)
    const nuevos = seleccion[turnoId] || new Set()
    const turno  = turnos.find(t => t.id === turnoId)
    const previos = new Set((turno?.empleados || []).map(e => e.id))
    try {
      // Empleados a asignar (no estaban antes) o a desasignar (estaban antes)
      const cambios = emps.filter(e => nuevos.has(e.id) !== previos.has(e.id))
      await Promise.all(cambios.map(e =>
        nuevos.has(e.id)
          ? api.asignarTurno(token, e.id, turnoId)
          : api.desasignarTurno(token, e.id, turnoId)
      ))
      toast('Asignaciones guardadas'); load()
    } catch (e) { toast('Error: ' + e.message, 'err') }
    finally { setGuardando(null) }
  }

  return (
    <div>
      <SH title='Jornadas laborales' sub={`${turnos.length} jornadas · ${emps.length} empleados`}>
        {seccion === 'jornadas' && <Btn label='+ Nueva jornada' onClick={() => { setForm(formVacio); setEditando('nuevo') }} />}
      </SH>

      {/* Selector de sección */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['jornadas', 'asignaciones'].map(s => (
          <button key={s} onClick={() => { setSeccion(s); setEditando(null) }} style={{ padding: '6px 16px', borderRadius: 4, fontSize: 11, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', background: seccion === s ? 'var(--accent)' : 'var(--surface2)', color: seccion === s ? '#0f0f0f' : 'var(--muted)', border: seccion === s ? 'none' : '1px solid var(--border)' }}>
            {s === 'jornadas' ? `Jornadas (${turnos.length})` : `Asignaciones (${emps.length})`}
          </button>
        ))}
      </div>

      {/* ── SECCIÓN JORNADAS ──────────────────────────────────────────── */}
      {seccion === 'jornadas' && (
        <>
          {/* Formulario crear/editar */}
          {editando && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 8, padding: 18, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--accent)', marginBottom: 14 }}>
                {editando === 'nuevo' ? 'Nueva jornada' : `Editando: ${editando.nombre}`}
              </div>
              <div className="mobile-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div style={{ gridColumn: 'span 3' }}>
                  <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>NOMBRE DE LA JORNADA</label>
                  <input placeholder='Ej: Jornada Estándar, Media Jornada...' value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>HORA ENTRADA</label>
                  <input type='time' value={form.hora_entrada} onChange={e => setForm(f => ({ ...f, hora_entrada: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>HORA SALIDA</label>
                  <input type='time' value={form.hora_salida} onChange={e => setForm(f => ({ ...f, hora_salida: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                  <div style={{ fontSize: 13, color: 'var(--accent2)', fontWeight: 'bold' }}>
                    {durTurno(form.hora_entrada, form.hora_salida)}/día
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Días laborables</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {DIAS_SEM.map(d => (
                    <button key={d.v} onClick={() => toggleDia(d.v)} style={{ width: 36, height: 36, borderRadius: '50%', background: form.dias_semana.includes(d.v) ? 'var(--accent)' : 'var(--surface2)', color: form.dias_semana.includes(d.v) ? '#0f0f0f' : 'var(--muted)', border: `1px solid ${form.dias_semana.includes(d.v) ? 'var(--accent)' : 'var(--border)'}`, fontWeight: 'bold', fontSize: 12, cursor: 'pointer' }}>{d.n}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn label={editando === 'nuevo' ? 'Crear jornada' : 'Guardar'} onClick={guardar} />
                <Btn label='Cancelar' ghost onClick={() => setEditando(null)} />
              </div>
            </div>
          )}

          {/* Lista de jornadas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
            {turnos.map(t => (
              <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 10 }}>{t.nombre}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div style={{ background: 'var(--surface2)', borderRadius: 6, padding: '7px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>Entrada</div>
                    <div style={{ fontSize: 15, fontWeight: 'bold', color: 'var(--accent2)' }}>{t.hora_entrada?.slice(0,5) || '—'}</div>
                  </div>
                  <div style={{ background: 'var(--surface2)', borderRadius: 6, padding: '7px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>Salida</div>
                    <div style={{ fontSize: 15, fontWeight: 'bold', color: 'var(--danger)' }}>{t.hora_salida?.slice(0,5) || '—'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                  {nomDias(t.dias_semana)} · <span style={{ color: 'var(--accent)' }}>{durTurno(t.hora_entrada, t.hora_salida)}/día</span>
                </div>
                {/* Empleados asignados */}
                <div style={{ marginBottom: 10 }}>
                  {t.empleados?.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {t.empleados.map(e => (
                        <span key={e.id} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}>{e.nombre.split(' ')[0]}</span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>Sin empleados asignados</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setForm({ nombre: t.nombre, hora_entrada: t.hora_entrada?.slice(0,5)||'08:00', hora_salida: t.hora_salida?.slice(0,5)||'18:00', dias_semana: t.dias_semana||[1,2,3,4,5] }); setEditando(t) }} style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', fontSize: 11, border: '1px solid var(--border)', padding: '6px 0', borderRadius: 4, cursor: 'pointer' }}>✎ Editar</button>
                  <button onClick={() => eliminar(t.id)} style={{ background: 'transparent', color: 'var(--danger)', fontSize: 11, border: '1px solid var(--danger)', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
          {turnos.length === 0 && !editando && <Empty txt='Crea una jornada para empezar' />}
        </>
      )}

      {/* ── SECCIÓN ASIGNACIONES ──────────────────────────────────────── */}
      {seccion === 'asignaciones' && (
        <>
          {turnos.length === 0 && <Empty txt='Primero crea una jornada en la pestaña "Jornadas"' />}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {turnos.map(turno => {
              const sel = seleccion[turno.id] || new Set()
              const asignados = emps.filter(e => sel.has(e.id)).length
              return (
                <div key={turno.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>{turno.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{turno.hora_entrada?.slice(0,5)}–{turno.hora_salida?.slice(0,5)} · {nomDias(turno.dias_semana)}</div>
                    <div style={{ fontSize: 11, color: 'var(--accent2)', marginTop: 3 }}>{asignados} empleado{asignados !== 1 ? 's' : ''} asignado{asignados !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 12, maxHeight: 220, overflowY: 'auto' }}>
                    {emps.length === 0 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>Sin empleados</div>}
                    {emps.map(e => (
                      <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
                        <input
                          type='checkbox'
                          checked={sel.has(e.id)}
                          onChange={() => toggleEmpSeleccion(turno.id, e.id)}
                          style={{ accentColor: 'var(--accent)', width: 15, height: 15, flexShrink: 0 }}
                        />
                        <Av name={e.nombre} size={24} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 'bold' }}>{e.nombre}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{e.cargo || e.departamento || '—'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <Btn
                    label={guardando === turno.id ? 'Guardando…' : 'Guardar asignaciones'}
                    onClick={() => guardarAsignaciones(turno.id)}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function AdminInformes({ token, toast }) {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth())
  const [anio, setAnio] = useState(now.getFullYear())
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  async function generar() {
    setLoading(true); setPreview(null)
    try {
      const data = await api.getInformes(token, mes, anio)
      setPreview(data)
    } catch (e) { toast('Error: ' + e.message, 'err') }
    finally { setLoading(false) }
  }

  async function exportar(det) {
    if (!preview) return
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet(det ? 'Detallado' : 'Resumen')
    if (!det) {
      ws.columns = [{ header: 'Empleado', width: 22 }, { header: 'Departamento', width: 14 }, { header: 'Días trabajados', width: 14 }, { header: 'Horas totales', width: 14 }, { header: 'Aus. aprobadas', width: 18 }, { header: 'Aus. pendientes', width: 18 }]
      preview.filas.forEach(f => ws.addRow([f.nombre, f.departamento, f.dias, f.horas, f.ausencias_aprobadas, f.ausencias_pendientes]))
    } else {
      ws.columns = [{ header: 'Empleado', width: 22 }, { header: 'Departamento', width: 14 }, { header: 'Fecha', width: 12 }, { header: 'Entrada', width: 10 }, { header: 'Salida', width: 10 }, { header: 'Total', width: 12 }]
      preview.filas.forEach(f => f.fichajes.forEach(fi => ws.addRow([f.nombre, f.departamento, fi.fecha, fmt(fi.entrada), fi.salida ? fmt(fi.salida) : '-', fi.salida ? fmtDur(new Date(fi.salida) - new Date(fi.entrada)) : '-'])))
    }
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const name = det ? `detallado_${meses[preview.mes]}_${preview.anio}.xlsx` : `resumen_${meses[preview.mes]}_${preview.anio}.xlsx`
    const a = document.createElement('a'); a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
    toast('Excel descargado')
  }

  return (
    <div>
      <SH title='Informes mensuales' />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} style={{ width: 160 }}>{meses.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))} style={{ width: 100 }}>{[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}</select>
          <Btn label={loading ? 'Generando...' : 'Generar'} onClick={generar} />
        </div>
      </div>
      {preview && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button onClick={() => exportar(false)} style={{ background: 'var(--accent2)', color: '#0f0f0f', padding: '8px 16px', fontSize: 11, fontWeight: 'bold', borderRadius: 4, border: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>↓ Resumen Excel</button>
            <button onClick={() => exportar(true)} style={{ background: 'var(--info)', color: '#fff', padding: '8px 16px', fontSize: 11, fontWeight: 'bold', borderRadius: 4, border: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>↓ Detallado Excel</button>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent)', marginBottom: 14, textTransform: 'uppercase' }}>{meses[preview.mes]} {preview.anio}</div>
            <Tabla cols={['Empleado', 'Dpto', 'Días', 'Horas', 'Aus.Ap', 'Aus.Pe']}>
              {preview.filas.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 'bold' }}>{f.nombre}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--muted)' }}>{f.departamento}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13, color: 'var(--accent)' }}>{f.dias}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12 }}>{f.horas}</td>
                  <td style={{ padding: '9px 10px' }}>{f.ausencias_aprobadas > 0 ? <Badge label={f.ausencias_aprobadas} c='var(--accent2)' /> : <span style={{ color: 'var(--muted)', fontSize: 12 }}>0</span>}</td>
                  <td style={{ padding: '9px 10px' }}>{f.ausencias_pendientes > 0 ? <Badge label={f.ausencias_pendientes} c='var(--danger)' /> : <span style={{ color: 'var(--muted)', fontSize: 12 }}>0</span>}</td>
                </tr>
              ))}
            </Tabla>
          </div>
        </>
      )}
      {!preview && !loading && <Empty txt='Selecciona mes y genera el informe' />}
    </div>
  )
}

function AdminAlertas({ token }) {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAlertas(token).then(d => { setAlertas(d); setLoading(false) }).catch(() => setLoading(false))
  }, [token])

  const col = { danger: 'var(--danger)', warn: 'var(--accent)', info: 'var(--info)' }
  const icon = { sin_salida: '⚠', jornada_larga: '⏱', no_fichado: '◎' }
  const label = { danger: 'Urgente', warn: 'Aviso', info: 'Pendiente' }
  const titulosGrupo = { sin_salida: 'Fichajes sin salida', jornada_larga: 'Jornadas excesivas (>10h)', no_fichado: 'Sin fichar hoy' }
  const grupos = { sin_salida: alertas.filter(a => a.tipo === 'sin_salida'), jornada_larga: alertas.filter(a => a.tipo === 'jornada_larga'), no_fichado: alertas.filter(a => a.tipo === 'no_fichado') }

  return (
    <div>
      <SH title='Alertas' sub={loading ? 'Comprobando...' : alertas.length === 0 ? 'Sin incidencias' : `${alertas.length} avisos activos`} />
      {loading ? <Loading /> : alertas.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--accent2)', borderRadius: 8, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
          <div style={{ fontSize: 13, color: 'var(--accent2)', fontWeight: 'bold', marginBottom: 4 }}>Todo en orden</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>No hay alertas pendientes</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(grupos).filter(([, arr]) => arr.length > 0).map(([tipo, arr]) => (
            <div key={tipo}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{titulosGrupo[tipo]}</span>
                <span style={{ background: col[arr[0].nivel], color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>{arr.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {arr.map((a, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${col[a.nivel]}33`, borderLeft: `3px solid ${col[a.nivel]}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20, color: col[a.nivel], flexShrink: 0 }}>{icon[a.tipo]}</span>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>{a.msg}</div></div>
                    <Badge label={label[a.nivel]} c={col[a.nivel]} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Documentos Admin ─────────────────────────────────────────────────────────
const TIPOS_DOC = ['Nómina', 'Contrato', 'Certificado', 'Formación', 'Otro']

function AdminDocumentos({ token, toast }) {
  const [docs, setDocs]           = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [filtroEmp, setFiltroEmp] = useState('')
  const [form, setForm]           = useState({ empleado_id: '', nombre: '', tipo: 'Nómina', descripcion: '' })
  const [archivo, setArchivo]     = useState(null)

  useEffect(() => {
    api.getEmpleadosAdmin(token).then(setEmpleados).catch(() => {})
  }, [token])

  const load = useCallback(() => {
    setLoading(true)
    const params = filtroEmp ? { empleado_id: filtroEmp } : {}
    api.getDocumentosAdmin(token, params)
      .then(d => { setDocs(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token, filtroEmp])

  useEffect(load, [load])

  async function subir() {
    if (!form.empleado_id || !form.nombre || !archivo) {
      return toast('Selecciona empleado, nombre y archivo')
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('empleado_id', form.empleado_id)
      fd.append('nombre', form.nombre)
      fd.append('tipo', form.tipo)
      fd.append('descripcion', form.descripcion)
      fd.append('archivo', archivo)
      await api.postDocumento(token, fd)
      toast('Documento subido')
      setShowForm(false)
      setForm({ empleado_id: '', nombre: '', tipo: 'Nómina', descripcion: '' })
      setArchivo(null)
      load()
    } catch (e) { toast(e.message) } finally { setUploading(false) }
  }

  async function borrar(id, nombre) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    try {
      await api.deleteDocumento(token, id)
      toast('Documento eliminado')
      load()
    } catch (e) { toast(e.message) }
  }

  const empNombre = id => empleados.find(e => e.id === id)?.nombre || '—'

  return (
    <div>
      <SH title='Documentos' sub={`${docs.length} archivos`} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>Filtrar:</span>
          <select value={filtroEmp} onChange={e => setFiltroEmp(e.target.value)} style={{ width: 180 }}>
            <option value=''>Todos los empleados</option>
            {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <Btn label='+ Subir documento' onClick={() => setShowForm(v => !v)} />
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent)', marginBottom: 14, textTransform: 'uppercase' }}>Nuevo documento</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, letterSpacing: 1 }}>EMPLEADO *</div>
              <select value={form.empleado_id} onChange={e => setForm(f => ({ ...f, empleado_id: e.target.value }))} style={{ width: '100%' }}>
                <option value=''>Seleccionar empleado</option>
                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <input placeholder='Nombre del documento *' value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={{ width: '100%' }}>
              {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder='Descripción (opcional)' value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          </div>
          <div style={{ marginTop: 10 }}>
            <input type='file' onChange={e => setArchivo(e.target.files[0] || null)}
              style={{ fontSize: 12, color: 'var(--muted)', width: '100%', padding: '8px 0' }} />
            {archivo && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>✓ {archivo.name} ({(archivo.size/1024).toFixed(1)} KB)</div>}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Btn label={uploading ? 'Subiendo...' : 'Subir'} onClick={subir} />
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 14px', fontSize: 11, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? <Loading /> : docs.length === 0 ? (
        <Empty txt='No hay documentos subidos' />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <Tabla cols={['Empleado', 'Documento', 'Tipo', 'Descripción', 'Fecha', '']}>
            {docs.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 'bold' }}>{d.empleados?.nombre || empNombre(d.empleado_id)}</td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>{d.nombre}</td>
                <td style={{ padding: '10px 12px' }}>{d.tipo ? <Badge label={d.tipo} c='var(--accent)' /> : <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>}</td>
                <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--muted)', maxWidth: 180 }}>{d.descripcion || '—'}</td>
                <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtDate(d.created_at)}</td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  {d.url && <a href={d.url} target='_blank' rel='noreferrer' style={{ fontSize: 11, color: 'var(--accent)', marginRight: 10, textDecoration: 'none', letterSpacing: 1 }}>↓ Ver</a>}
                  <button onClick={() => borrar(d.id, d.nombre)} style={{ fontSize: 11, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>Borrar</button>
                </td>
              </tr>
            ))}
          </Tabla>
        </div>
      )}
    </div>
  )
}

// ─── Festivos ─────────────────────────────────────────────────────────────────
const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function AdminFestivos({ token, toast }) {
  const [festivosEmpresa, setFestivosEmpresa] = useState([])
  const [anio, setAnio]     = useState(new Date().getFullYear())
  const [form, setForm]     = useState({ fecha: today(), nombre: '' })
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    api.getFestivos(token, anio).then(setFestivosEmpresa).catch(() => {})
  }, [token, anio])
  useEffect(load, [load])

  // Nacionales calculados automáticamente
  const nacionales = festivosNacionales(anio)

  // Todos juntos ordenados por fecha (para la lista mensual)
  const todos = [
    ...nacionales,
    ...festivosEmpresa.map(f => ({ ...f, _db: true }))
  ].sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Agrupar por mes
  const porMes = {}
  todos.forEach(f => {
    const m = new Date(f.fecha).getMonth()
    if (!porMes[m]) porMes[m] = []
    porMes[m].push(f)
  })

  async function crear() {
    if (!form.fecha || !form.nombre.trim()) { toast('Fecha y nombre son obligatorios', 'err'); return }
    setLoading(true)
    try { await api.postFestivo(token, { ...form, tipo: 'empresa' }); toast('Festivo añadido'); setForm({ fecha: today(), nombre: '' }); load() }
    catch (e) { toast('Error: ' + e.message, 'err') }
    finally { setLoading(false) }
  }

  async function eliminar(id) {
    try { await api.deleteFestivo(token, id); toast('Festivo eliminado'); load() }
    catch (e) { toast('Error: ' + e.message, 'err') }
  }

  return (
    <div>
      <SH title='Días festivos' sub={`${nacionales.length} nacionales + ${festivosEmpresa.length} de empresa · ${anio}`} />

      {/* Selector de año */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setAnio(a => a - 1)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '5px 12px', borderRadius: 4, cursor: 'pointer' }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 'bold' }}>{anio}</span>
        <button onClick={() => setAnio(a => a + 1)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '5px 12px', borderRadius: 4, cursor: 'pointer' }}>→</button>
      </div>

      {/* Formulario añadir festivo de empresa */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 18, marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Añadir festivo de empresa</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Fecha</label>
            <input type='date' value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Nombre</label>
            <input placeholder='Ej: Fiesta local, Puente empresa...' value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} onKeyDown={e => e.key === 'Enter' && crear()} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Btn label={loading ? 'Guardando...' : 'Añadir festivo'} onClick={crear} disabled={loading} />
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 11, color: 'var(--muted)' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'rgba(192,96,74,0.3)', border: '1px solid rgba(192,96,74,0.5)', marginRight: 5 }} />Nacional (automático)</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'rgba(200,169,110,0.3)', border: '1px solid rgba(200,169,110,0.5)', marginRight: 5 }} />Empresa</span>
      </div>

      {/* Lista agrupada por mes */}
      {Object.keys(porMes).sort((a,b) => a-b).map(m => (
        <div key={m} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 'bold' }}>{MESES_CORTOS[m]}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {porMes[m].map((f, idx) => {
              const isEmpresa = !!f._db
              const c = isEmpresa ? '#c8a96e' : '#c0604a'
              const d = new Date(f.fecha)
              return (
                <div key={f.id || `n-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: `1px solid ${c}44`, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ width: 40, textAlign: 'center', background: `${c}22`, borderRadius: 6, padding: '4px 0', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: c, lineHeight: 1 }}>{d.getDate()}</div>
                    <div style={{ fontSize: 9, color: c, letterSpacing: 1 }}>{['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()]}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 'bold' }}>{f.nombre}</div>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: `${c}22`, color: c, border: `1px solid ${c}44` }}>
                      {isEmpresa ? 'empresa' : 'nacional'}
                    </span>
                  </div>
                  {isEmpresa && (
                    <button onClick={() => eliminar(f.id)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Eliminar</button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

