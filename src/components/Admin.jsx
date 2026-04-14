import { useState, useEffect, useCallback } from 'react'
import ExcelJS from 'exceljs'
import { api } from '../lib/api'
import { SH, Av, Badge, Btn, Tabla, Empty, Loading, TopBar, fmt, fmtDate, fmtDur, today, COLORS } from './shared'

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
  const [emps, setEmps] = useState([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', cargo: '', departamento: '', pin: '', dias_vacaciones: 22 })
  const load = useCallback(() => {
    api.getEmpleadosAdmin(token).then(setEmps).catch(() => {})
  }, [token])
  useEffect(load, [load])

  async function guardar() {
    if (!form.nombre || !form.email || !form.pin) { toast('Nombre, email y PIN obligatorios', 'err'); return }
    try {
      await api.postEmpleado(token, form)
      toast('Empleado añadido')
      setForm({ nombre: '', email: '', cargo: '', departamento: '', pin: '', dias_vacaciones: 22 })
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
          </div>
          <div style={{ display: 'flex', gap: 8 }}><Btn label='Guardar' onClick={guardar} /><Btn label='Cancelar' ghost onClick={() => setShow(false)} /></div>
        </div>
      )}
      <div className="emp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {emps.map((e, i) => (
          <div key={e.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Av name={e.nombre} size={34} color={COLORS[i % COLORS.length]} />
              <div><div style={{ fontSize: 14, fontWeight: 'bold' }}>{e.nombre}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{e.cargo}</div></div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{e.departamento} · {e.email}</div>
            <div style={{ fontSize: 11, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--accent2)' }}>{e.dias_usados || 0} usados</span>
              <span style={{ color: 'var(--muted)' }}>{(e.dias_vacaciones || 22) - (e.dias_usados || 0)} restantes</span>
            </div>
            <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, marginBottom: 10 }}>
              <div style={{ height: '100%', background: 'var(--accent2)', width: `${Math.min(((e.dias_usados || 0) / (e.dias_vacaciones || 22)) * 100, 100)}%`, borderRadius: 2 }} />
            </div>
            <button onClick={() => eliminar(e.id)} style={{ background: 'transparent', color: 'var(--danger)', fontSize: 11, border: '1px solid var(--danger)', padding: '4px 10px', borderRadius: 4, width: '100%' }}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminTurnos({ token, toast }) {
  const [turnos, setTurnos] = useState([])
  const [emps, setEmps] = useState([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ nombre: '', hora_entrada: '08:00', hora_salida: '17:00', empleado_id: '', dias_semana: [1, 2, 3, 4, 5] })
  const DIAS = [{ n: 'L', v: 1 }, { n: 'M', v: 2 }, { n: 'X', v: 3 }, { n: 'J', v: 4 }, { n: 'V', v: 5 }, { n: 'S', v: 6 }, { n: 'D', v: 0 }]

  const load = useCallback(() => {
    Promise.all([api.getTurnos(token), api.getEmpleadosAdmin(token)])
      .then(([t, e]) => { setTurnos(t); setEmps(e) }).catch(() => {})
  }, [token])
  useEffect(load, [load])

  async function guardar() {
    if (!form.nombre || !form.empleado_id) { toast('Nombre y empleado obligatorios', 'err'); return }
    try {
      await api.postTurno(token, form)
      toast('Turno creado')
      setForm({ nombre: '', hora_entrada: '08:00', hora_salida: '17:00', empleado_id: '', dias_semana: [1, 2, 3, 4, 5] })
      setShow(false); load()
    } catch (e) { toast('Error: ' + e.message, 'err') }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar turno?')) return
    try { await api.deleteTurno(token, id); toast('Eliminado'); load() }
    catch (e) { toast('Error: ' + e.message, 'err') }
  }

  const toggleDia = v => setForm(f => ({ ...f, dias_semana: f.dias_semana.includes(v) ? f.dias_semana.filter(d => d !== v) : [...f.dias_semana, v].sort((a, b) => a - b) }))
  const nomDias = d => { const ns = DIAS.filter(x => (d || []).includes(x.v)).map(x => x.n); return ns.length ? ns.join(' ') : '—' }
  const durTurno = (e, s) => { const [eh, em] = e.split(':').map(Number); const [sh, sm] = s.split(':').map(Number); const diff = (sh * 60 + sm) - (eh * 60 + em); return diff > 0 ? `${Math.floor(diff / 60)}h ${diff % 60}m` : '—' }

  return (
    <div>
      <SH title='Gestión de turnos' sub={`${turnos.length} turnos activos`}><Btn label='+ Nuevo turno' onClick={() => setShow(!show)} /></SH>
      {show && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 8, padding: 18, marginBottom: 18 }}>
          <div className="mobile-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <input placeholder='Nombre del turno' value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <select value={form.empleado_id} onChange={e => setForm(f => ({ ...f, empleado_id: e.target.value }))}>
              <option value=''>-- Asignar empleado --</option>
              {emps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>HORA ENTRADA</label><input type='time' value={form.hora_entrada} onChange={e => setForm(f => ({ ...f, hora_entrada: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>HORA SALIDA</label><input type='time' value={form.hora_salida} onChange={e => setForm(f => ({ ...f, hora_salida: e.target.value }))} /></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase' }}>Días de la semana</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {DIAS.map(d => (
                <button key={d.v} onClick={() => toggleDia(d.v)} style={{ width: 36, height: 36, borderRadius: '50%', background: form.dias_semana.includes(d.v) ? 'var(--accent)' : 'var(--surface2)', color: form.dias_semana.includes(d.v) ? '#0f0f0f' : 'var(--muted)', border: `1px solid ${form.dias_semana.includes(d.v) ? 'var(--accent)' : 'var(--border)'}`, fontWeight: 'bold', fontSize: 12 }}>{d.n}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}><Btn label='Guardar turno' onClick={guardar} /><Btn label='Cancelar' ghost onClick={() => setShow(false)} /></div>
        </div>
      )}
      {turnos.length === 0 && !show ? <Empty txt='No hay turnos definidos' /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 12 }}>
          {turnos.map(t => (
            <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{t.nombre}</div>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: 'rgba(200,169,110,0.15)', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{t.hora_entrada?.slice(0, 5)} — {t.hora_salida?.slice(0, 5)}</span>
              </div>
              {t.empleados && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Av name={t.empleados.nombre} size={24} /><span style={{ fontSize: 13 }}>{t.empleados.nombre}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
                <span>Días: {nomDias(t.dias_semana)}</span>
                <span>{durTurno(t.hora_entrada, t.hora_salida)}/día</span>
              </div>
              <button onClick={() => eliminar(t.id)} style={{ background: 'transparent', color: 'var(--danger)', fontSize: 11, border: '1px solid var(--danger)', padding: '4px 10px', borderRadius: 4, width: '100%' }}>Eliminar</button>
            </div>
          ))}
        </div>
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
