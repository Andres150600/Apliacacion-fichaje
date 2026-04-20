import { useState, useEffect, useCallback } from 'react'
import ExcelJS from 'exceljs'
import { api } from '../lib/api'
import { SH, Av, Badge, Btn, Tabla, Empty, Loading, TopBar, fmt, fmtDate, fmtDur, today, COLORS, festivosNacionales } from './shared'

export default function Admin({ user, token, onLogout, toast, dark, toggleDark }) {
  const [tab, setTab] = useState('dashboard')
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
    { id: 'informes',  icon: '▤', label: 'Informes' },
    { id: 'alertas',   icon: '▲', label: 'Alertas' },
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
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 18px', background: tab === t.id ? 'var(--surface2)' : 'transparent', color: tab === t.id ? 'var(--accent)' : 'var(--muted)', textAlign: 'left', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', borderLeft: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent', borderRight: 'none', borderTop: 'none', borderBottom: 'none' }}>
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
        {tab === 'alertas'   && <AdminAlertas token={token} />}
      </main>
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {tabs.map(t => (
            <button key={t.id} className={`bnav-item${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
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

function AdminDashboard({ token }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    api.getDashboard(token).then(setData).catch(() => {})
  }, [token])

  if (!data) return <Loading />
  const { stats, semana, departamentos, recientes } = data
  const mx = Math.max(...semana.map(s => s.n), 1)

  return (
    <div>
      <SH title='Panel de control' sub={fmtDate(new Date())} />
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
        {[{ l: 'Empleados', v: stats.empleados }, { l: 'Fichajes hoy', v: stats.fichajes_hoy }, { l: 'En oficina', v: stats.en_oficina, hi: true }, { l: 'Pendientes', v: stats.pendientes, warn: stats.pendientes > 0 }].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${s.hi ? 'var(--accent2)' : s.warn ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase' }}>{s.l}</div>
            <div style={{ fontSize: 28, color: s.hi ? 'var(--accent2)' : s.warn ? 'var(--danger)' : 'var(--text)' }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="week-dept-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 22 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase' }}>Esta semana</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 72 }}>
            {semana.map((s, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: '100%', background: s.n > 0 ? 'var(--accent)' : 'var(--surface2)', height: `${(s.n / mx) * 60 + 4}px`, minHeight: 4, borderRadius: 2 }} />
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{s.d}</span>
                {s.n > 0 && <span style={{ fontSize: 10, color: 'var(--accent)' }}>{s.n}</span>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase' }}>Departamentos</div>
          {departamentos.map(([d, n], i) => (
            <div key={d} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}><span>{d}</span><span style={{ color: 'var(--accent)' }}>{n}</span></div>
              <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 2 }}><div style={{ height: '100%', background: COLORS[i % COLORS.length], width: `${(n / Math.max(...departamentos.map(x => x[1]), 1)) * 100}%`, borderRadius: 2 }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase' }}>Actividad reciente</div>
        {recientes.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
            <Av name={r.empleados?.nombre || '?'} size={26} />
            <span style={{ flex: 1, fontSize: 13 }}>{r.empleados?.nombre}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(r.fecha)}</span>
            <span style={{ fontSize: 11, color: 'var(--accent2)' }}>↑{fmt(r.entrada)}</span>
            {r.salida && <span style={{ fontSize: 11, color: 'var(--danger)' }}>↓{fmt(r.salida)}</span>}
          </div>
        ))}
        {recientes.length === 0 && <Empty txt='Sin actividad' />}
      </div>
    </div>
  )
}

function AdminFichajes({ token, toast }) {
  const [rows, setRows] = useState([])
  const [emps, setEmps] = useState([])
  const [fE, setFE] = useState('')
  const [fF, setFF] = useState('')
  const [loading, setLoading] = useState(true)

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

  return (
    <div>
      <SH title='Registro de fichajes' sub={`${rows.length} registros`}><Btn label='↓ Excel' onClick={exportExcel} /></SH>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <select value={fE} onChange={e => setFE(e.target.value)} style={{ width: 200 }}>
          <option value=''>Todos</option>
          {emps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <input type='date' value={fF} onChange={e => setFF(e.target.value)} style={{ width: 160 }} />
        {(fE || fF) && <Btn label='Limpiar' ghost onClick={() => { setFE(''); setFF('') }} />}
      </div>
      {loading ? <Loading /> : (
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
      {!loading && rows.length === 0 && <Empty txt='No hay fichajes' />}
    </div>
  )
}

function AdminAusencias({ token, toast }) {
  const [rows, setRows] = useState([])
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

  return (
    <div>
      <SH title='Ausencias' sub={`${rows.filter(r => r.estado === 'pendiente').length} pendientes`} />
      <Tabla cols={['Empleado', 'Tipo', 'Desde', 'Hasta', 'Motivo', 'Estado', '']}>
        {rows.map(a => (
          <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '9px 10px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Av name={a.empleados?.nombre || '?'} size={22} /><span style={{ fontSize: 13 }}>{a.empleados?.nombre}</span></div></td>
            <td style={{ padding: '9px 10px', fontSize: 12 }}>{a.tipo}</td>
            <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--muted)' }}>{fmtDate(a.desde)}</td>
            <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--muted)' }}>{fmtDate(a.hasta)}</td>
            <td style={{ padding: '9px 10px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.motivo}</td>
            <td style={{ padding: '9px 10px' }}><Badge label={a.estado} c={a.estado === 'aprobada' ? 'var(--accent2)' : a.estado === 'rechazada' ? 'var(--danger)' : 'var(--accent)'} /></td>
            <td style={{ padding: '9px 10px' }}>
              {a.estado === 'pendiente' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => cambiar(a.id, 'aprobada')} style={{ background: 'var(--accent2)', color: '#0f0f0f', padding: '4px 10px', fontSize: 11, borderRadius: 4 }}>✓</button>
                  <button onClick={() => cambiar(a.id, 'rechazada')} style={{ background: 'var(--danger)', color: '#fff', padding: '4px 10px', fontSize: 11, borderRadius: 4 }}>✗</button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </Tabla>
      {rows.length === 0 && <Empty txt='No hay solicitudes' />}
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

