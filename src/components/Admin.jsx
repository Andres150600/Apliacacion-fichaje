import { useState, useEffect, useCallback } from 'react'
import ExcelJS from 'exceljs'
import { sb } from '../lib/supabase'
import { SH, Av, Badge, Btn, Tabla, Empty, Loading, TopBar, PinModal, fmt, fmtDate, fmtDur, today, COLORS } from './shared'

export default function Admin({ user, onLogout, toast, dark, toggleDark }) {
  const [tab, setTab] = useState('dashboard')
  const [pend, setPend] = useState(0)
  const [nAlertas, setNAlertas] = useState(0)

  useEffect(() => {
    sb.from('ausencias').select('id', { count: 'exact' }).eq('estado', 'pendiente').then(({ count }) => setPend(count || 0))
    const t = today()
    sb.from('fichajes').select('id', { count: 'exact' }).is('salida', null).not('entrada', 'is', null).lt('fecha', t)
      .then(a => setNAlertas(a.count || 0))
  }, [tab])

  const tabs = [
    { id: 'dashboard', icon: '▦', label: 'Panel' },
    { id: 'fichajes', icon: '◷', label: 'Fichajes' },
    { id: 'ausencias', icon: '◌', label: 'Ausencias' },
    { id: 'empleados', icon: '◉', label: 'Equipo' },
    { id: 'turnos', icon: '◑', label: 'Turnos' },
    { id: 'informes', icon: '▤', label: 'Informes' },
    { id: 'alertas', icon: '▲', label: 'Alertas' },
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
        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'fichajes' && <AdminFichajes toast={toast} />}
        {tab === 'ausencias' && <AdminAusencias toast={toast} user={user} />}
        {tab === 'empleados' && <AdminEmpleados toast={toast} user={user} />}
        {tab === 'turnos' && <AdminTurnos toast={toast} user={user} />}
        {tab === 'informes' && <AdminInformes toast={toast} />}
        {tab === 'alertas' && <AdminAlertas />}
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

function AdminDashboard() {
  const [stats, setStats] = useState({ e: 0, f: 0, o: 0, p: 0 })
  const [sem, setSem] = useState([])
  const [dep, setDep] = useState([])
  const [rec, setRec] = useState([])

  useEffect(() => {
    const t = today()
    const getLunes = () => { const d = new Date(); const dow = d.getDay() || 7; d.setDate(d.getDate() - dow + 1); return d.toISOString().split('T')[0] }
    Promise.all([
      sb.from('empleados').select('id,departamento', { count: 'exact' }).eq('es_admin', false).eq('activo', true),
      sb.from('fichajes').select('id,entrada,salida').eq('fecha', t),
      sb.from('ausencias').select('id', { count: 'exact' }).eq('estado', 'pendiente'),
      sb.from('fichajes').select('fecha').gte('fecha', getLunes()),
      sb.from('fichajes').select('id,empleado_id,fecha,entrada,salida,empleados(nombre)').order('created_at', { ascending: false }).limit(6),
    ]).then(([e, f, p, s, r]) => {
      setStats({ e: e.count || 0, f: (f.data || []).filter(x => x.entrada).length, o: (f.data || []).filter(x => x.entrada && !x.salida).length, p: p.count || 0 })
      const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      const map = {}; (s.data || []).forEach(x => { map[x.fecha] = (map[x.fecha] || 0) + 1 })
      setSem(dias.map((d, i) => { const dt = new Date(); const dow = dt.getDay() || 7; dt.setDate(dt.getDate() - dow + i + 1); return { d, n: map[dt.toISOString().split('T')[0]] || 0 } }))
      const dm = {}; (e.data || []).forEach(x => { dm[x.departamento] = (dm[x.departamento] || 0) + 1 })
      setDep(Object.entries(dm)); setRec(r.data || [])
    })
  }, [])

  const mx = Math.max(...sem.map(s => s.n), 1)
  return (
    <div>
      <SH title='Panel de control' sub={fmtDate(new Date())} />
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
        {[{ l: 'Empleados', v: stats.e }, { l: 'Fichajes hoy', v: stats.f }, { l: 'En oficina', v: stats.o, hi: true }, { l: 'Pendientes', v: stats.p, warn: stats.p > 0 }].map((s, i) => (
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
            {sem.map((s, i) => (
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
          {dep.map(([d, n], i) => (
            <div key={d} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}><span>{d}</span><span style={{ color: 'var(--accent)' }}>{n}</span></div>
              <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 2 }}><div style={{ height: '100%', background: COLORS[i % COLORS.length], width: `${(n / Math.max(...dep.map(x => x[1]), 1)) * 100}%`, borderRadius: 2 }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase' }}>Actividad reciente</div>
        {rec.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
            <Av name={r.empleados?.nombre || '?'} size={26} />
            <span style={{ flex: 1, fontSize: 13 }}>{r.empleados?.nombre}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(r.fecha)}</span>
            <span style={{ fontSize: 11, color: 'var(--accent2)' }}>↑{fmt(r.entrada)}</span>
            {r.salida && <span style={{ fontSize: 11, color: 'var(--danger)' }}>↓{fmt(r.salida)}</span>}
          </div>
        ))}
        {rec.length === 0 && <Empty txt='Sin actividad' />}
      </div>
    </div>
  )
}

function AdminFichajes({ toast }) {
  const [rows, setRows] = useState([])
  const [emps, setEmps] = useState([])
  const [fE, setFE] = useState('')
  const [fF, setFF] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sb.from('empleados').select('id,nombre').eq('es_admin', false).order('nombre').then(({ data }) => setEmps(data || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    let q = sb.from('fichajes').select('id,empleado_id,fecha,entrada,salida,created_at,empleados(nombre)').order('created_at', { ascending: false })
    if (fE) q = q.eq('empleado_id', fE)
    if (fF) q = q.eq('fecha', fF)
    q.then(({ data }) => { setRows(data || []); setLoading(false) })
  }, [fE, fF])

  async function exportExcel() {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Fichajes')
    ws.columns = [
      { header: 'Empleado', width: 22 },
      { header: 'Fecha', width: 12 },
      { header: 'Entrada', width: 10 },
      { header: 'Salida', width: 10 },
      { header: 'Total', width: 12 },
      { header: 'Estado', width: 12 },
    ]
    rows.forEach(r => ws.addRow([
      r.empleados?.nombre || '-', r.fecha, fmt(r.entrada),
      r.salida ? fmt(r.salida) : '-',
      r.salida ? fmtDur(new Date(r.salida) - new Date(r.entrada)) : 'En curso',
      r.salida ? 'Completo' : 'En curso'
    ]))
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

function AdminAusencias({ toast, user }) {
  const [rows, setRows] = useState([])
  const [modal, setModal] = useState(null) // { id, estado }
  const load = useCallback(() => {
    sb.from('ausencias').select('id,tipo,desde,hasta,motivo,estado,created_at,empleados(nombre)').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []))
  }, [])
  useEffect(load, [load])

  function cambiar(id, estado) {
    setModal({ id, estado })
  }

  async function confirmarCambio(adminPin) {
    const { id, estado } = modal
    setModal(null)
    const { data, error } = await sb.rpc('admin_cambiar_ausencia', { p_admin_id: user.id, p_admin_pin: adminPin, p_aus_id: id, p_estado: estado })
    if (error || !data?.ok) toast('Error: ' + (data?.error || error?.message || 'desconocido'), 'err')
    else { toast(estado === 'aprobada' ? 'Aprobada' : 'Rechazada'); load() }
  }

  return (
    <div>
      {modal && <PinModal titulo={`Confirma tu PIN para ${modal.estado === 'aprobada' ? 'aprobar' : 'rechazar'} la ausencia`} onConfirm={confirmarCambio} onCancel={() => setModal(null)} />}
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

function AdminEmpleados({ toast, user }) {
  const [emps, setEmps] = useState([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', cargo: '', departamento: '', pin: '', dias_vacaciones: 22 })
  const [modal, setModal] = useState(null) // { accion: 'crear' | 'eliminar', empId? }
  const load = useCallback(() => {
    sb.from('empleados').select('id,nombre,email,cargo,departamento,activo,dias_vacaciones,dias_usados').eq('es_admin', false).eq('activo', true).order('nombre').then(({ data }) => setEmps(data || []))
  }, [])
  useEffect(load, [load])

  async function guardar() {
    if (!form.nombre || !form.email || !form.pin) { toast('Nombre, email y PIN obligatorios', 'err'); return }
    setModal({ accion: 'crear' })
  }

  async function confirmarGuardar(adminPin) {
    setModal(null)
    const { data, error } = await sb.rpc('admin_crear_empleado', {
      p_admin_id: user.id, p_admin_pin: adminPin,
      p_nombre: form.nombre, p_email: form.email,
      p_departamento: form.departamento, p_cargo: form.cargo,
      p_pin: form.pin, p_dias_vacaciones: form.dias_vacaciones
    })
    if (error || !data?.ok) toast('Error: ' + (data?.error || error?.message || 'desconocido'), 'err')
    else { toast('Empleado añadido'); setForm({ nombre: '', email: '', cargo: '', departamento: '', pin: '', dias_vacaciones: 22 }); setShow(false); load() }
  }

  function eliminar(id) {
    setModal({ accion: 'eliminar', empId: id })
  }

  async function confirmarEliminar(adminPin) {
    const id = modal.empId
    setModal(null)
    const { data, error } = await sb.rpc('admin_desactivar_empleado', { p_admin_id: user.id, p_admin_pin: adminPin, p_emp_id: id })
    if (error || !data?.ok) toast('Error: ' + (data?.error || error?.message || 'desconocido'), 'err')
    else { toast('Eliminado'); load() }
  }

  return (
    <div>
      {modal?.accion === 'crear' && <PinModal titulo='Confirma tu PIN para crear el empleado' onConfirm={confirmarGuardar} onCancel={() => setModal(null)} />}
      {modal?.accion === 'eliminar' && <PinModal titulo='Confirma tu PIN para eliminar el empleado' onConfirm={confirmarEliminar} onCancel={() => setModal(null)} />}
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

function AdminTurnos({ toast, user }) {
  const [turnos, setTurnos] = useState([])
  const [emps, setEmps] = useState([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ nombre: '', hora_entrada: '08:00', hora_salida: '17:00', empleado_id: '', dias_semana: [1, 2, 3, 4, 5] })
  const [modal, setModal] = useState(null) // { accion: 'crear' | 'eliminar', turnoId? }
  const DIAS = [{ n: 'L', v: 1 }, { n: 'M', v: 2 }, { n: 'X', v: 3 }, { n: 'J', v: 4 }, { n: 'V', v: 5 }, { n: 'S', v: 6 }, { n: 'D', v: 0 }]

  const load = useCallback(() => {
    Promise.all([
      sb.from('turnos').select('id,nombre,hora_entrada,hora_salida,dias_semana,empleados(nombre)').eq('activo', true).order('created_at', { ascending: false }),
      sb.from('empleados').select('id,nombre').eq('es_admin', false).eq('activo', true).order('nombre')
    ]).then(([t, e]) => { setTurnos(t.data || []); setEmps(e.data || []) })
  }, [])
  useEffect(load, [load])

  function guardar() {
    if (!form.nombre || !form.empleado_id) { toast('Nombre y empleado obligatorios', 'err'); return }
    setModal({ accion: 'crear' })
  }

  async function confirmarGuardar(adminPin) {
    setModal(null)
    const { data, error } = await sb.rpc('admin_crear_turno', {
      p_admin_id: user.id, p_admin_pin: adminPin,
      p_nombre: form.nombre, p_empleado_id: form.empleado_id,
      p_hora_entrada: form.hora_entrada, p_hora_salida: form.hora_salida,
      p_dias_semana: form.dias_semana
    })
    if (error || !data?.ok) toast('Error: ' + (data?.error || error?.message || 'desconocido'), 'err')
    else { toast('Turno creado'); setForm({ nombre: '', hora_entrada: '08:00', hora_salida: '17:00', empleado_id: '', dias_semana: [1, 2, 3, 4, 5] }); setShow(false); load() }
  }

  function eliminar(id) {
    setModal({ accion: 'eliminar', turnoId: id })
  }

  async function confirmarEliminar(adminPin) {
    const id = modal.turnoId
    setModal(null)
    const { data, error } = await sb.rpc('admin_eliminar_turno', { p_admin_id: user.id, p_admin_pin: adminPin, p_turno_id: id })
    if (error || !data?.ok) toast('Error: ' + (data?.error || error?.message || 'desconocido'), 'err')
    else { toast('Eliminado'); load() }
  }

  const toggleDia = v => setForm(f => ({ ...f, dias_semana: f.dias_semana.includes(v) ? f.dias_semana.filter(d => d !== v) : [...f.dias_semana, v].sort((a, b) => a - b) }))
  const nomDias = d => { const ns = DIAS.filter(x => (d || []).includes(x.v)).map(x => x.n); return ns.length ? ns.join(' ') : '—' }
  const durTurno = (e, s) => { const [eh, em] = e.split(':').map(Number); const [sh, sm] = s.split(':').map(Number); const diff = (sh * 60 + sm) - (eh * 60 + em); return diff > 0 ? `${Math.floor(diff / 60)}h ${diff % 60}m` : '—' }

  return (
    <div>
      {modal?.accion === 'crear' && <PinModal titulo='Confirma tu PIN para crear el turno' onConfirm={confirmarGuardar} onCancel={() => setModal(null)} />}
      {modal?.accion === 'eliminar' && <PinModal titulo='Confirma tu PIN para eliminar el turno' onConfirm={confirmarEliminar} onCancel={() => setModal(null)} />}
      <SH title='Gestión de turnos' sub={`${turnos.length} turnos activos`}><Btn label='+ Nuevo turno' onClick={() => setShow(!show)} /></SH>
      {show && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 8, padding: 18, marginBottom: 18 }}>
          <div className="mobile-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <input placeholder='Nombre del turno (ej: Mañana, Tarde...)' value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <select value={form.empleado_id} onChange={e => setForm(f => ({ ...f, empleado_id: e.target.value }))}>
              <option value=''>-- Asignar empleado --</option>
              {emps.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4, letterSpacing: 1 }}>HORA ENTRADA</label><input type='time' value={form.hora_entrada} onChange={e => setForm(f => ({ ...f, hora_entrada: e.target.value }))} /></div>
            <div><label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4, letterSpacing: 1 }}>HORA SALIDA</label><input type='time' value={form.hora_salida} onChange={e => setForm(f => ({ ...f, hora_salida: e.target.value }))} /></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Días de la semana</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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

function AdminInformes({ toast }) {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth())
  const [anio, setAnio] = useState(now.getFullYear())
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  async function generar() {
    setLoading(true); setPreview(null)
    const desde = `${anio}-${String(mes + 1).padStart(2, '0')}-01`
    const hasta = `${anio}-${String(mes + 1).padStart(2, '0')}-${new Date(anio, mes + 1, 0).getDate()}`
    const [{ data: emps }, { data: fichs }, { data: aus }] = await Promise.all([
      sb.from('empleados').select('id,nombre,departamento').eq('es_admin', false).eq('activo', true).order('nombre'),
      sb.from('fichajes').select('*').gte('fecha', desde).lte('fecha', hasta),
      sb.from('ausencias').select('*').gte('desde', desde).lte('hasta', hasta),
    ])
    const filas = (emps || []).map(emp => {
      const mf = (fichs || []).filter(f => f.empleado_id === emp.id)
      const ma = (aus || []).filter(a => a.empleado_id === emp.id)
      const ms = mf.filter(f => f.salida).reduce((a, f) => a + (new Date(f.salida) - new Date(f.entrada)), 0)
      return { nombre: emp.nombre, dept: emp.departamento, dias: mf.filter(f => f.entrada).length, horas: fmtDur(ms), ausAp: ma.filter(a => a.estado === 'aprobada').length, ausPe: ma.filter(a => a.estado === 'pendiente').length, fichajes: mf }
    })
    setPreview({ filas, mes: meses[mes], anio }); setLoading(false)
  }

  async function exportar(det) {
    if (!preview) return
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet(det ? 'Detallado' : 'Resumen')
    if (!det) {
      ws.columns = [
        { header: 'Empleado', width: 22 }, { header: 'Departamento', width: 14 },
        { header: 'Días trabajados', width: 14 }, { header: 'Horas totales', width: 14 },
        { header: 'Ausencias aprobadas', width: 18 }, { header: 'Ausencias pendientes', width: 18 },
      ]
      preview.filas.forEach(f => ws.addRow([f.nombre, f.dept, f.dias, f.horas, f.ausAp, f.ausPe]))
    } else {
      ws.columns = [
        { header: 'Empleado', width: 22 }, { header: 'Departamento', width: 14 },
        { header: 'Fecha', width: 12 }, { header: 'Entrada', width: 10 },
        { header: 'Salida', width: 10 }, { header: 'Total', width: 12 },
      ]
      preview.filas.forEach(f => f.fichajes.forEach(fi => ws.addRow([
        f.nombre, f.dept, fi.fecha, fmt(fi.entrada),
        fi.salida ? fmt(fi.salida) : '-',
        fi.salida ? fmtDur(new Date(fi.salida) - new Date(fi.entrada)) : '-'
      ])))
    }
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const name = det ? `detallado_${preview.mes}_${preview.anio}.xlsx` : `resumen_${preview.mes}_${preview.anio}.xlsx`
    const a = document.createElement('a'); a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
    toast('Excel descargado')
  }

  return (
    <div>
      <SH title='Informes mensuales' />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} style={{ width: 160 }}>
            {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))} style={{ width: 100 }}>
            {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <Btn label={loading ? 'Generando...' : 'Generar'} onClick={generar} />
        </div>
      </div>
      {preview && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => exportar(false)} style={{ background: 'var(--accent2)', color: '#0f0f0f', padding: '8px 16px', fontSize: 11, fontWeight: 'bold', borderRadius: 4, border: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>↓ Resumen Excel</button>
            <button onClick={() => exportar(true)} style={{ background: 'var(--info)', color: '#fff', padding: '8px 16px', fontSize: 11, fontWeight: 'bold', borderRadius: 4, border: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>↓ Detallado Excel</button>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent)', marginBottom: 14, textTransform: 'uppercase' }}>{preview.mes} {preview.anio}</div>
            <Tabla cols={['Empleado', 'Dpto', 'Días', 'Horas', 'Aus.Ap', 'Aus.Pe']}>
              {preview.filas.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 'bold' }}>{f.nombre}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--muted)' }}>{f.dept}</td>
                  <td style={{ padding: '9px 10px', fontSize: 13, color: 'var(--accent)' }}>{f.dias}</td>
                  <td style={{ padding: '9px 10px', fontSize: 12 }}>{f.horas}</td>
                  <td style={{ padding: '9px 10px' }}>{f.ausAp > 0 ? <Badge label={f.ausAp} c='var(--accent2)' /> : <span style={{ color: 'var(--muted)', fontSize: 12 }}>0</span>}</td>
                  <td style={{ padding: '9px 10px' }}>{f.ausPe > 0 ? <Badge label={f.ausPe} c='var(--danger)' /> : <span style={{ color: 'var(--muted)', fontSize: 12 }}>0</span>}</td>
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

function AdminAlertas() {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = today()
    const hoy = new Date()
    const dow = hoy.getDay()
    const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    Promise.all([
      sb.from('fichajes').select('id,fecha,entrada,salida,empleados(nombre,departamento)').is('salida', null).not('entrada', 'is', null).lt('fecha', t),
      sb.from('fichajes').select('id,fecha,entrada,salida,empleados(nombre)').not('salida', 'is', null).gte('fecha', hace30),
      dow >= 1 && dow <= 5 ? sb.from('empleados').select('id,nombre,departamento').eq('es_admin', false).eq('activo', true) : Promise.resolve({ data: [] }),
      dow >= 1 && dow <= 5 ? sb.from('fichajes').select('empleado_id').eq('fecha', t) : Promise.resolve({ data: [] }),
    ]).then(([abiertos, recientes, emps, fichadosHoy]) => {
      const als = []
      ;(abiertos.data || []).forEach(f => {
        als.push({ tipo: 'sin_salida', nivel: 'danger', msg: `${f.empleados?.nombre} — sin registrar salida el ${fmtDate(f.fecha)}` })
      })
      ;(recientes.data || []).forEach(f => {
        const dur = new Date(f.salida) - new Date(f.entrada)
        if (dur > 10 * 3600000) als.push({ tipo: 'jornada_larga', nivel: 'warn', msg: `${f.empleados?.nombre} — ${fmtDur(dur)} trabajadas el ${fmtDate(f.fecha)}` })
      })
      if (dow >= 1 && dow <= 5) {
        const ids = new Set((fichadosHoy.data || []).map(f => f.empleado_id))
        ;(emps.data || []).forEach(e => {
          if (!ids.has(e.id)) als.push({ tipo: 'no_fichado', nivel: 'info', msg: `${e.nombre}${e.departamento ? ' (' + e.departamento + ')' : ''} — no ha registrado entrada hoy` })
        })
      }
      setAlertas(als); setLoading(false)
    })
  }, [])

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
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, marginBottom: 2 }}>{a.msg}</div></div>
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
