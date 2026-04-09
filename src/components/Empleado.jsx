import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { SH, Av, Badge, Btn, Tabla, Empty, TopBar, fmt, fmtDate, fmtDur, today, COLORS } from './shared'

export default function Empleado({ user, token, onLogout, toast, dark, toggleDark }) {
  const [tab, setTab] = useState('fichar')
  const [checkedIn, setCheckedIn] = useState(false)
  const [fichajeHoy, setFichajeHoy] = useState(null)

  const checkStatus = useCallback(() => {
    api.getFichajeHoy(token).then(data => {
      setFichajeHoy(data)
      setCheckedIn(!!(data && data.entrada && !data.salida))
    }).catch(() => {})
  }, [token])

  useEffect(checkStatus, [checkStatus])

  const tabs = [
    { id: 'fichar',     icon: '◷', label: 'Fichar' },
    { id: 'historial',  icon: '▤', label: 'Historial' },
    { id: 'ausencias',  icon: '◌', label: 'Ausencias' },
    { id: 'calendario', icon: '▦', label: 'Equipo' },
    { id: 'documentos', icon: '▣', label: 'Docs' },
  ]

  const props = { user, token, toast, dark, toggleDark, onLogout, checkedIn, fichajeHoy, onAction: checkStatus }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="desktop-sidebar" style={{ width: 190, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '22px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: 'var(--accent)', marginBottom: 3, textTransform: 'uppercase' }}>Empleado</div>
            <div style={{ fontSize: 14, fontWeight: 'bold' }}>{user.nombre.split(' ')[0]}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 10, letterSpacing: 1, textTransform: 'uppercase', background: checkedIn ? 'rgba(143,184,160,0.2)' : 'rgba(128,128,128,0.1)', color: checkedIn ? 'var(--accent2)' : 'var(--muted)', border: `1px solid ${checkedIn ? 'var(--accent2)' : 'var(--border)'}` }}>
                {checkedIn ? 'En oficina' : 'Fuera'}
              </span>
            </div>
          </div>
          <button onClick={toggleDark} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: 12, fontSize: 11 }}>{dark ? '☀' : '☾'}</button>
        </div>
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 18px', background: tab === t.id ? 'var(--surface2)' : 'transparent', color: tab === t.id ? 'var(--accent)' : 'var(--muted)', textAlign: 'left', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', borderLeft: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent', borderRight: 'none', borderTop: 'none', borderBottom: 'none' }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} style={{ padding: '13px 18px', background: 'transparent', color: 'var(--muted)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'left', borderTop: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>Cerrar sesión</button>
      </aside>
      <main className="main-pad" style={{ flex: 1, overflow: 'auto', padding: 26, background: 'var(--bg)' }}>
        <TopBar user={user} dark={dark} toggleDark={toggleDark} onLogout={onLogout} checkedIn={checkedIn} />
        {tab === 'fichar'     && <EmpFichar {...props} />}
        {tab === 'historial'  && <EmpHistorial {...props} />}
        {tab === 'ausencias'  && <EmpAusencias {...props} />}
        {tab === 'calendario' && <Calendario {...props} />}
        {tab === 'documentos' && <EmpDocumentos {...props} />}
      </main>
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {tabs.map(t => (
            <button key={t.id} className={`bnav-item${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="bnav-icon">{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
          <button className="bnav-item" onClick={onLogout}><span className="bnav-icon">⏏</span><span>Salir</span></button>
        </div>
      </nav>
    </div>
  )
}

function EmpFichar({ user, token, checkedIn, fichajeHoy, onAction, toast }) {
  const [now, setNow] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [vac, setVac] = useState(null)

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => { api.getMe(token).then(setVac).catch(() => {}) }, [token])

  async function getGeo() {
    return new Promise(res => {
      if (!navigator.geolocation) return res({})
      const t = setTimeout(() => res({}), 5000)
      navigator.geolocation.getCurrentPosition(
        p => { clearTimeout(t); res({ lat_entrada: p.coords.latitude, lng_entrada: p.coords.longitude }) },
        () => { clearTimeout(t); res({}) },
        { timeout: 4000, maximumAge: 60000 }
      )
    })
  }

  async function fichar(tipo) {
    setLoading(true)
    try {
      if (tipo === 'entrada') {
        if (checkedIn) { toast('Ya tienes entrada activa', 'err'); return }
        const pos = await getGeo()
        await api.postFichaje(token, { fecha: today(), entrada: new Date().toISOString(), ...pos })
        toast('Entrada registrada')
      } else {
        if (!fichajeHoy?.entrada || fichajeHoy?.salida) { toast('No hay entrada activa', 'err'); return }
        const pos = await getGeo()
        const datos = { salida: new Date().toISOString() }
        if (pos.lat_entrada != null) { datos.lat_salida = pos.lat_entrada; datos.lng_salida = pos.lng_entrada }
        await api.patchFichaje(token, fichajeHoy.id, datos)
        toast('Salida registrada')
      }
      onAction()
    } catch (e) {
      toast('Error al fichar: ' + (e?.message || 'inténtalo de nuevo'), 'err')
    } finally {
      setLoading(false)
    }
  }

  const rest = vac ? (vac.dias_vacaciones || 22) - (vac.dias_usados || 0) : null

  return (
    <div>
      <SH title={`Hola, ${user.nombre.split(' ')[0]}`} sub={now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} />
      <div style={{ textAlign: 'center', padding: '32px 0', marginBottom: 22 }}>
        <div style={{ fontSize: 50, letterSpacing: 5, fontWeight: 'bold', color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>{now.toLocaleTimeString('es-ES')}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 28 }}>Hora actual</div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => fichar('entrada')} disabled={checkedIn || loading} style={{ padding: '14px 36px', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 'bold', background: checkedIn ? 'var(--surface2)' : 'var(--accent2)', color: checkedIn ? 'var(--muted)' : '#0f0f0f', borderRadius: 4, cursor: checkedIn ? 'not-allowed' : 'pointer' }}>↑ Entrada</button>
          <button onClick={() => fichar('salida')} disabled={!checkedIn || loading} style={{ padding: '14px 36px', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 'bold', background: !checkedIn ? 'var(--surface2)' : 'var(--danger)', color: !checkedIn ? 'var(--muted)' : '#fff', borderRadius: 4, cursor: !checkedIn ? 'not-allowed' : 'pointer' }}>↓ Salida</button>
        </div>
        {fichajeHoy?.entrada && !fichajeHoy.salida && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--accent2)', fontVariantNumeric: 'tabular-nums', letterSpacing: 2 }}>
              {fmtDur(now - new Date(fichajeHoy.entrada))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
              Tiempo trabajado · Entrada: <span style={{ color: 'var(--accent2)' }}>{fmt(fichajeHoy.entrada)}</span>
            </div>
          </div>
        )}
        {fichajeHoy?.salida && (
          <div style={{ marginTop: 18, fontSize: 12, color: 'var(--muted)' }}>
            Entrada: <span style={{ color: 'var(--accent2)' }}>{fmt(fichajeHoy.entrada)}</span>
            {' · '}Salida: <span style={{ color: 'var(--danger)' }}>{fmt(fichajeHoy.salida)}</span>
            {' · '}Total: <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{fmtDur(new Date(fichajeHoy.salida) - new Date(fichajeHoy.entrada))}</span>
          </div>
        )}
      </div>
      {vac && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase' }}>Mis vacaciones</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13 }}>{vac.dias_usados || 0} días usados</span>
            <span style={{ fontSize: 13, color: 'var(--accent2)', fontWeight: 'bold' }}>{rest} disponibles</span>
          </div>
          <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3 }}>
            <div style={{ height: '100%', background: 'var(--accent2)', width: `${Math.min(((vac.dias_usados || 0) / (vac.dias_vacaciones || 22)) * 100, 100)}%`, borderRadius: 3, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{vac.dias_vacaciones || 22} días totales</div>
        </div>
      )}
    </div>
  )
}

function EmpHistorial({ token }) {
  const [rows, setRows] = useState([])
  useEffect(() => { api.getFichajes(token).then(setRows).catch(() => {}) }, [token])
  const total = rows.filter(r => r.salida).reduce((a, r) => a + (new Date(r.salida) - new Date(r.entrada)), 0)
  return (
    <div>
      <SH title='Mi historial' sub={`${rows.length} registros · ${fmtDur(total)} totales`} />
      <Tabla cols={['Fecha', 'Entrada', 'Salida', 'Total', 'Estado']}>
        {rows.map(r => {
          const dur = r.salida ? fmtDur(new Date(r.salida) - new Date(r.entrada)) : null
          return (
            <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '9px 10px', fontSize: 13 }}>{fmtDate(r.fecha)}</td>
              <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--accent2)' }}>↑{fmt(r.entrada)}</td>
              <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--danger)' }}>{r.salida ? `↓${fmt(r.salida)}` : '-'}</td>
              <td style={{ padding: '9px 10px', fontSize: 12 }}>{dur || '-'}</td>
              <td style={{ padding: '9px 10px' }}><Badge label={r.salida ? 'Completo' : 'En curso'} c={r.salida ? 'var(--accent2)' : 'var(--accent)'} /></td>
            </tr>
          )
        })}
      </Tabla>
      {rows.length === 0 && <Empty txt='Sin fichajes todavía' />}
    </div>
  )
}

function EmpAusencias({ token, toast }) {
  const [rows, setRows] = useState([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ tipo: 'Vacaciones', desde: today(), hasta: today(), motivo: '' })
  const load = useCallback(() => { api.getAusencias(token).then(setRows).catch(() => {}) }, [token])
  useEffect(load, [load])

  async function enviar() {
    if (!form.motivo) { toast('Indica el motivo', 'err'); return }
    try { await api.postAusencia(token, form); toast('Solicitud enviada'); setShow(false); load() }
    catch (e) { toast('Error: ' + e.message, 'err') }
  }

  return (
    <div>
      <SH title='Mis ausencias' sub={`${rows.length} solicitudes`}><Btn label='+ Solicitar' onClick={() => setShow(!show)} /></SH>
      {show && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 8, padding: 18, marginBottom: 18 }}>
          <div className="mobile-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              {['Vacaciones', 'Enfermedad', 'Personal', 'Maternidad/Paternidad', 'Otro'].map(t => <option key={t}>{t}</option>)}
            </select>
            <input type='date' value={form.desde} onChange={e => setForm(f => ({ ...f, desde: e.target.value }))} />
            <input type='date' value={form.hasta} onChange={e => setForm(f => ({ ...f, hasta: e.target.value }))} />
            <input placeholder='Motivo' value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} style={{ gridColumn: 'span 3' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}><Btn label='Enviar' onClick={enviar} /><Btn label='Cancelar' ghost onClick={() => setShow(false)} /></div>
        </div>
      )}
      <Tabla cols={['Tipo', 'Desde', 'Hasta', 'Motivo', 'Estado']}>
        {rows.map(a => (
          <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '9px 10px', fontSize: 12 }}>{a.tipo}</td>
            <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--muted)' }}>{fmtDate(a.desde)}</td>
            <td style={{ padding: '9px 10px', fontSize: 12, color: 'var(--muted)' }}>{fmtDate(a.hasta)}</td>
            <td style={{ padding: '9px 10px', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.motivo}</td>
            <td style={{ padding: '9px 10px' }}><Badge label={a.estado} c={a.estado === 'aprobada' ? 'var(--accent2)' : a.estado === 'rechazada' ? 'var(--danger)' : 'var(--accent)'} /></td>
          </tr>
        ))}
      </Tabla>
      {rows.length === 0 && <Empty txt='Sin solicitudes' />}
    </div>
  )
}

function Calendario({ token }) {
  const [mes, setMes] = useState(new Date().getMonth())
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [aus, setAus] = useState([])
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  useEffect(() => {
    const desde = `${anio}-${String(mes + 1).padStart(2, '0')}-01`
    const hasta = `${anio}-${String(mes + 1).padStart(2, '0')}-${new Date(anio, mes + 1, 0).getDate()}`
    api.getAusencias(token, { estado: 'aprobada', desde, hasta }).then(setAus).catch(() => {})
  }, [mes, anio, token])

  const primerDia = new Date(anio, mes, 1).getDay() || 7
  const diasMes = new Date(anio, mes + 1, 0).getDate()

  function ausDelDia(dia) {
    const f = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return aus.filter(a => a.desde <= f && a.hasta >= f)
  }

  return (
    <div>
      <SH title='Calendario del equipo' />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => { if (mes === 0) { setMes(11); setAnio(a => a - 1) } else setMes(m => m - 1) }} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', borderRadius: 4 }}>←</button>
        <span style={{ fontSize: 15, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>{meses[mes]} {anio}</span>
        <button onClick={() => { if (mes === 11) { setMes(0); setAnio(a => a + 1) } else setMes(m => m + 1) }} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', borderRadius: 4 }}>→</button>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 8 }}>
          {dias.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', padding: '4px 0' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {Array.from({ length: primerDia - 1 }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: diasMes }).map((_, i) => {
            const dia = i + 1; const ad = ausDelDia(dia)
            const esHoy = new Date().getDate() === dia && new Date().getMonth() === mes && new Date().getFullYear() === anio
            return (
              <div key={dia} style={{ minHeight: 36, borderRadius: 4, padding: '3px', background: esHoy ? 'rgba(200,169,110,0.15)' : ad.length > 0 ? 'rgba(143,184,160,0.08)' : 'transparent', border: esHoy ? '1px solid var(--accent)' : '1px solid transparent' }}>
                <div style={{ fontSize: 11, textAlign: 'center', color: esHoy ? 'var(--accent)' : 'var(--text)', fontWeight: esHoy ? 'bold' : 'normal' }}>{dia}</div>
                {ad.slice(0, 2).map((a, j) => <div key={j} style={{ fontSize: 9, background: COLORS[j] + '33', color: COLORS[j], borderRadius: 2, padding: '1px 3px', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.empleados?.nombre?.split(' ')[0]}</div>)}
                {ad.length > 2 && <div style={{ fontSize: 9, color: 'var(--muted)' }}>+{ad.length - 2}</div>}
              </div>
            )
          })}
        </div>
      </div>
      {aus.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase' }}>Ausencias del mes</div>
          {aus.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <Av name={a.empleados?.nombre || '?'} size={26} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>{a.empleados?.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.tipo}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>
                <div>{fmtDate(a.desde)}</div><div>{fmtDate(a.hasta)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {aus.length === 0 && <Empty txt='Sin ausencias este mes' />}
    </div>
  )
}

function EmpDocumentos({ token }) {
  const [docs, setDocs] = useState([])
  useEffect(() => { api.getDocumentos(token).then(setDocs).catch(() => {}) }, [token])
  return (
    <div>
      <SH title='Mis documentos' sub={`${docs.length} archivos`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
        {docs.map(d => (
          <div key={d.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{d.nombre}</div>
            {d.tipo && <Badge label={d.tipo} c='var(--info)' />}
            {d.descripcion && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{d.descripcion}</div>}
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>{fmtDate(d.created_at)}</div>
          </div>
        ))}
      </div>
      {docs.length === 0 && <Empty txt='El admin aún no ha añadido documentos' />}
    </div>
  )
}
