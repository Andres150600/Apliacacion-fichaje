import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { SH, Av, Badge, Btn, Tabla, Empty, TopBar, fmt, fmtDate, fmtDur, fmtDurS, calcNetMs, today, COLORS } from './shared'

function EmpleadoWrapper(props) {
  const [pausaModal, setPausaModal] = useState(false)
  return <EmpleadoInner {...props} pausaModal={pausaModal} _setPausaModal={setPausaModal} />
}

function EmpleadoInner({ user, token, onLogout, toast, dark, toggleDark, fichajeHoy, pausas, pausaActiva, onRefreshFichaje, onSetFichajeHoy, onSetPausas, onSetPausaActiva, pausaModal, _setPausaModal }) {
  const [tab, setTab] = useState('fichar')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const netMs = calcNetMs(fichajeHoy, pausas, pausaActiva, now)

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

  async function ficharEntrada() {
    try {
      const pos = await getGeo()
      await api.postFichaje(token, { fecha: today(), entrada: new Date().toISOString(), ...pos })
      toast('Entrada registrada')
      onRefreshFichaje()
    } catch (e) { toast('Error al fichar: ' + (e?.message || ''), 'err') }
  }

  async function ficharSalida() {
    if (!fichajeHoy?.id) return
    try {
      if (pausaActiva) await api.patchPausa(token, pausaActiva.id)
      const pos = await getGeo()
      const datos = { salida: new Date().toISOString() }
      if (pos.lat_entrada != null) { datos.lat_salida = pos.lat_entrada; datos.lng_salida = pos.lng_entrada }
      await api.patchFichaje(token, fichajeHoy.id, datos)
      toast('Salida registrada')
      onRefreshFichaje()
    } catch (e) { toast('Error al fichar salida: ' + (e?.message || ''), 'err') }
  }

  async function pausar(tipo = 'Otra') {
    if (!fichajeHoy?.id) return
    try {
      await api.postPausa(token, { fichaje_id: fichajeHoy.id, tipo })
      toast('Pausa iniciada')
      onRefreshFichaje()
    } catch (e) { toast('Error: ' + (e?.message || ''), 'err') }
  }

  async function reanudar() {
    if (!pausaActiva) return
    try {
      await api.patchPausa(token, pausaActiva.id)
      toast('Jornada reanudada')
      onRefreshFichaje()
    } catch (e) { toast('Error: ' + (e?.message || ''), 'err') }
  }

  const checkedIn = !!(fichajeHoy?.entrada && !fichajeHoy?.salida)

  const tabs = [
    { id: 'fichar',     icon: '◷', label: 'Fichar' },
    { id: 'historial',  icon: '▤', label: 'Historial' },
    { id: 'ausencias',  icon: '◌', label: 'Ausencias' },
    { id: 'horarios',   icon: '◑', label: 'Horarios' },
    { id: 'equipo',     icon: '▦', label: 'Equipo' },
    { id: 'documentos', icon: '▣', label: 'Docs' },
  ]

  const sharedProps = { user, token, toast, checkedIn, fichajeHoy, pausas, pausaActiva, netMs, now, onFicharEntrada: ficharEntrada, onFicharSalida: ficharSalida, onPausar: pausar, onReanudar: reanudar, onRefresh: onRefreshFichaje }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside className="desktop-sidebar" style={{ width: 200, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Av name={user.nombre} size={30} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 'bold' }}>{user.nombre.split(' ')[0]}</div>
                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: checkedIn ? (pausaActiva ? 'rgba(200,169,110,0.2)' : 'rgba(143,184,160,0.2)') : 'rgba(128,128,128,0.1)', color: checkedIn ? (pausaActiva ? 'var(--accent)' : 'var(--accent2)') : 'var(--muted)', border: `1px solid ${checkedIn ? (pausaActiva ? 'var(--accent)' : 'var(--accent2)') : 'var(--border)'}` }}>
                    {checkedIn ? (pausaActiva ? 'En pausa' : 'En oficina') : 'Fuera'}
                  </span>
                </div>
              </div>
              <button onClick={toggleDark} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer' }}>{dark ? '☀' : '☾'}</button>
            </div>

            {/* Contador siempre visible */}
            <div style={{ background: 'var(--surface2)', borderRadius: 6, padding: '8px 10px', marginBottom: 8, border: `1px solid ${pausaActiva ? 'var(--accent)' : checkedIn ? 'var(--accent2)' : 'var(--border)'}` }}>
              <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                {pausaActiva ? `⏸ ${pausaActiva.tipo}` : checkedIn ? '▶ Trabajado' : 'Sin entrada'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 'bold', fontVariantNumeric: 'tabular-nums', color: pausaActiva ? 'var(--accent)' : checkedIn ? 'var(--accent2)' : 'var(--muted)', letterSpacing: 1 }}>
                {fmtDurS(netMs)}
              </div>
            </div>

            {/* Botones acción rápida */}
            <div style={{ display: 'flex', gap: 5 }}>
              {!fichajeHoy?.entrada && (
                <button onClick={ficharEntrada} style={sideBtn('var(--accent2)')}>↑ Entrada</button>
              )}
              {checkedIn && !fichajeHoy?.salida && (
                pausaActiva
                  ? <button onClick={reanudar} style={sideBtn('var(--accent)')}>▶ Reanudar</button>
                  : <button onClick={() => _setPausaModal(true)} style={sideBtn('rgba(200,169,110,0.3)', 'var(--accent)')}>⏸ Pausa</button>
              )}
              {checkedIn && !fichajeHoy?.salida && (
                <button onClick={ficharSalida} style={sideBtn('var(--danger)', '#fff')}>⏏ Salida</button>
              )}
            </div>
          </div>

          <nav style={{ flex: 1, padding: '8px 0' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', background: tab === t.id ? 'var(--surface2)' : 'transparent', color: tab === t.id ? 'var(--accent)' : 'var(--muted)', textAlign: 'left', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', borderLeft: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent', borderRight: 'none', borderTop: 'none', borderBottom: 'none' }}>
                <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>
          <button onClick={onLogout} style={{ padding: '13px 16px', background: 'transparent', color: 'var(--muted)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'left', borderTop: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>Cerrar sesión</button>
        </aside>

        <main className="main-pad" style={{ flex: 1, overflow: 'auto', padding: 26, background: 'var(--bg)' }}>
          <TopBar user={user} dark={dark} toggleDark={toggleDark} onLogout={onLogout}
            netMs={netMs} pausaActiva={pausaActiva} fichajeHoy={fichajeHoy}
            onPausar={() => _setPausaModal(true)} onReanudar={reanudar} onSalida={ficharSalida}
          />
          {tab === 'fichar'     && <EmpFichar {...sharedProps} onShowPausa={() => _setPausaModal(true)} />}
          {tab === 'historial'  && <EmpHistorial token={token} />}
          {tab === 'ausencias'  && <EmpAusencias token={token} toast={toast} />}
          {tab === 'horarios'   && <EmpHorarios token={token} />}
          {tab === 'equipo'     && <Calendario token={token} />}
          {tab === 'documentos' && <EmpDocumentos token={token} />}
        </main>
      </div>

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

      <PausaModal visible={pausaModal} onConfirm={tipo => { _setPausaModal(false); pausar(tipo) }} onCancel={() => _setPausaModal(false)} />
    </div>
  )
}

function sideBtn(bg, color) {
  return { flex: 1, background: bg, color: color || '#0f0f0f', border: 'none', borderRadius: 4, padding: '5px 0', fontSize: 9, fontWeight: 'bold', cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }
}

// ─── Modal selector de tipo de pausa ─────────────────────────────────────────
function PausaModal({ visible, onConfirm, onCancel }) {
  if (!visible) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, width: '100%', maxWidth: 320 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Iniciar pausa</div>
        <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 16 }}>¿Qué tipo de pausa?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => onConfirm('Comida')} style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, fontSize: 13, textAlign: 'left', cursor: 'pointer' }}>
            🍽 Comida
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Siempre descuenta del tiempo trabajado</div>
          </button>
          <button onClick={() => onConfirm('Almuerzo')} style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, fontSize: 13, textAlign: 'left', cursor: 'pointer' }}>
            🥗 Almuerzo
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Solo descuenta si supera los 30 min</div>
          </button>
        </div>
        <button onClick={onCancel} style={{ marginTop: 12, width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
      </div>
    </div>
  )
}

// ─── Pestaña Fichar ───────────────────────────────────────────────────────────
function EmpFichar({ user, token, checkedIn, fichajeHoy, pausas, pausaActiva, netMs, now, onFicharEntrada, onFicharSalida, onShowPausa, onReanudar, onRefresh, toast }) {
  const [vac, setVac] = useState(null)
  const [showManual, setShowManual] = useState(false)

  useEffect(() => { api.getMe(token).then(setVac).catch(() => {}) }, [token])

  const rest = vac ? (vac.dias_vacaciones || 22) - (vac.dias_usados || 0) : null

  // Calcular duración de pausa activa para mostrar
  const durPausaActiva = pausaActiva ? (now - new Date(pausaActiva.inicio)) : 0

  return (
    <div>
      <SH title={`Hola, ${user.nombre.split(' ')[0]}`} sub={now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} />

      {/* Estado y contador */}
      <div style={{ textAlign: 'center', padding: '24px 0 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 44, letterSpacing: 4, fontWeight: 'bold', fontVariantNumeric: 'tabular-nums', color: pausaActiva ? 'var(--accent)' : checkedIn ? 'var(--accent2)' : 'var(--muted)', marginBottom: 4 }}>
          {fmtDurS(netMs)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          {pausaActiva ? `En pausa · ${pausaActiva.tipo} · ${fmtDur(durPausaActiva)}` : checkedIn ? 'Tiempo neto trabajado' : 'Sin jornada activa'}
        </div>
        {fichajeHoy?.entrada && (
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            Entrada: <span style={{ color: 'var(--accent2)' }}>{fmt(fichajeHoy.entrada)}</span>
            {fichajeHoy.salida && <> · Salida: <span style={{ color: 'var(--danger)' }}>{fmt(fichajeHoy.salida)}</span></>}
          </div>
        )}
      </div>

      {/* Botones principales */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        {!fichajeHoy?.entrada && (
          <button onClick={onFicharEntrada} style={{ padding: '13px 32px', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold', background: 'var(--accent2)', color: '#0f0f0f', borderRadius: 4, border: 'none', cursor: 'pointer' }}>↑ Fichar Entrada</button>
        )}
        {checkedIn && !fichajeHoy?.salida && (
          pausaActiva
            ? <button onClick={onReanudar} style={{ padding: '13px 32px', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold', background: 'var(--accent)', color: '#0f0f0f', borderRadius: 4, border: 'none', cursor: 'pointer' }}>▶ Reanudar Jornada</button>
            : <button onClick={onShowPausa} style={{ padding: '13px 24px', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold', background: 'var(--surface2)', color: 'var(--text)', borderRadius: 4, border: '1px solid var(--border)', cursor: 'pointer' }}>⏸ Pausar</button>
        )}
        {checkedIn && !fichajeHoy?.salida && (
          <button onClick={onFicharSalida} style={{ padding: '13px 32px', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold', background: 'var(--danger)', color: '#fff', borderRadius: 4, border: 'none', cursor: 'pointer' }}>⏏ Fichar Salida</button>
        )}
      </div>

      {/* Timeline de pausas */}
      {fichajeHoy?.entrada && pausas.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase' }}>Pausas de hoy</div>
          {pausas.map((p, i) => {
            const dur = p.fin ? new Date(p.fin) - new Date(p.inicio) : null
            const deducida = dur && !(p.tipo === 'Almuerzo' && dur <= 30 * 60000)
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < pausas.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 16 }}>{p.tipo === 'Almuerzo' ? '🍽' : p.tipo === 'Café' ? '☕' : p.tipo === 'Médico' ? '🏥' : '⏸'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold' }}>{p.tipo}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmt(p.inicio)} → {p.fin ? fmt(p.fin) : 'En curso'}</div>
                </div>
                {dur != null && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: deducida ? 'var(--danger)' : 'var(--accent2)' }}>{fmtDur(dur)}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{deducida ? 'Descontada' : 'No descontada'}</div>
                  </div>
                )}
                {!p.fin && <Badge label="En curso" c="var(--accent)" />}
              </div>
            )
          })}
        </div>
      )}

      {/* Vacaciones */}
      {vac && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase' }}>Mis vacaciones</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>{vac.dias_usados || 0} días usados</span>
            <span style={{ fontSize: 13, color: 'var(--accent2)', fontWeight: 'bold' }}>{rest} disponibles</span>
          </div>
          <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3 }}>
            <div style={{ height: '100%', background: 'var(--accent2)', width: `${Math.min(((vac.dias_usados || 0) / (vac.dias_vacaciones || 22)) * 100, 100)}%`, borderRadius: 3, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{vac.dias_vacaciones || 22} días totales</div>
        </div>
      )}

      {/* Fichaje manual */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showManual ? 14 : 0 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>Solicitar corrección de fichaje</div>
          <button onClick={() => setShowManual(s => !s)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>{showManual ? '−' : '+'}</button>
        </div>
        {showManual && <FichajeManualForm token={token} toast={toast} onClose={() => setShowManual(false)} />}
      </div>
    </div>
  )
}

// ─── Formulario de fichaje manual ─────────────────────────────────────────────
function FichajeManualForm({ token, toast, onClose }) {
  const [form, setForm] = useState({ fecha: today(), entrada: '', salida: '', motivo: '' })
  const [loading, setLoading] = useState(false)

  async function enviar() {
    if (!form.fecha || !form.entrada || !form.motivo) { toast('Fecha, entrada y motivo son obligatorios', 'err'); return }
    setLoading(true)
    try {
      await api.postFichajeManual(token, {
        fecha: form.fecha,
        entrada: `${form.fecha}T${form.entrada}:00`,
        salida: form.salida ? `${form.fecha}T${form.salida}:00` : null,
        motivo: form.motivo
      })
      toast('Solicitud enviada, pendiente de revisión')
      onClose()
    } catch (e) { toast('Error: ' + e.message, 'err') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="mobile-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Fecha</label>
          <input type='date' value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Entrada</label>
          <input type='time' value={form.entrada} onChange={e => setForm(f => ({ ...f, entrada: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Salida (opcional)</label>
          <input type='time' value={form.salida} onChange={e => setForm(f => ({ ...f, salida: e.target.value }))} />
        </div>
        <input placeholder='Motivo de la corrección' value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} style={{ gridColumn: 'span 3' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn label={loading ? 'Enviando...' : 'Enviar solicitud'} onClick={enviar} disabled={loading} />
        <Btn label='Cancelar' ghost onClick={onClose} />
      </div>
    </div>
  )
}

// ─── Historial ────────────────────────────────────────────────────────────────
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

// ─── Ausencias ────────────────────────────────────────────────────────────────
function EmpAusencias({ token, toast }) {
  const [rows, setRows]   = useState([])
  const [perfil, setPerfil] = useState(null)
  const [show, setShow]   = useState(false)
  const [anio, setAnio]   = useState(new Date().getFullYear())
  const [form, setForm]   = useState({ tipo: 'Vacaciones', desde: today(), hasta: today(), motivo: '' })

  const load = useCallback(() => {
    api.getAusencias(token).then(setRows).catch(() => {})
    api.getMe(token).then(setPerfil).catch(() => {})
  }, [token])
  useEffect(load, [load])

  async function enviar() {
    if (!form.motivo) { toast('Indica el motivo', 'err'); return }
    try { await api.postAusencia(token, form); toast('Solicitud enviada'); setShow(false); load() }
    catch (e) { toast('Error: ' + e.message, 'err') }
  }

  // Días de asuntos propios aprobados este año
  const diasPropiosUsados = rows.filter(r =>
    r.tipo === 'Personal' && r.estado === 'aprobada' &&
    new Date(r.desde).getFullYear() === anio
  ).reduce((acc, r) => {
    const d = Math.round((new Date(r.hasta) - new Date(r.desde)) / 86400000) + 1
    return acc + d
  }, 0)
  const DIAS_PROPIOS_TOTAL = 2

  // Construir mapa de días marcados para el calendario anual
  // { 'YYYY-MM-DD': 'aprobada' | 'pendiente' | 'rechazada' }
  const diasMarcados = {}
  rows.forEach(r => {
    const desde = new Date(r.desde)
    const hasta  = new Date(r.hasta)
    for (let d = new Date(desde); d <= hasta; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      // aprobada tiene prioridad sobre pendiente
      if (!diasMarcados[key] || r.estado === 'aprobada') diasMarcados[key] = r.estado
    }
  })

  const colorEstado = { aprobada: '#8fb8a0', pendiente: '#c8a96e', rechazada: '#c0604a' }
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const diasSemana = ['L','M','X','J','V','S','D']

  function renderMes(mes) {
    const primerDia = (new Date(anio, mes, 1).getDay() || 7) - 1
    const totalDias = new Date(anio, mes + 1, 0).getDate()
    const hoy = today()
    const celdas = []
    for (let i = 0; i < primerDia; i++) celdas.push(null)
    for (let d = 1; d <= totalDias; d++) celdas.push(d)

    return (
      <div key={mes} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--accent)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>{meses[mes]}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, marginBottom: 4 }}>
          {diasSemana.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 8, color: 'var(--muted)', padding: '2px 0' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
          {celdas.map((d, i) => {
            if (!d) return <div key={`e${i}`} />
            const fecha = `${anio}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const estado = diasMarcados[fecha]
            const esHoy = fecha === hoy
            return (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, padding: '3px 1px', borderRadius: 3, background: estado ? colorEstado[estado] + '55' : 'transparent', color: esHoy ? 'var(--accent)' : estado ? colorEstado[estado] : 'var(--text)', fontWeight: esHoy ? 'bold' : 'normal', border: esHoy ? '1px solid var(--accent)' : '1px solid transparent' }}>
                {d}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <SH title='Mis ausencias'><Btn label='+ Solicitar' onClick={() => setShow(!show)} /></SH>

      {/* Balance de días */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {/* Vacaciones */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>🏖 Vacaciones</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--accent2)' }}>{perfil ? (perfil.dias_vacaciones || 22) - (perfil.dias_usados || 0) : '–'}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Disponibles</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--text)' }}>{perfil?.dias_usados || 0}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Disfrutados</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--muted)' }}>{perfil?.dias_vacaciones || 22}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Total</div>
            </div>
          </div>
          <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3 }}>
            <div style={{ height: '100%', background: 'var(--accent2)', width: `${Math.min(((perfil?.dias_usados || 0) / (perfil?.dias_vacaciones || 22)) * 100, 100)}%`, borderRadius: 3, transition: 'width .3s' }} />
          </div>
        </div>
        {/* Asuntos propios */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>📋 Asuntos propios</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--accent2)' }}>{DIAS_PROPIOS_TOTAL - diasPropiosUsados}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Disponibles</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--text)' }}>{diasPropiosUsados}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Disfrutados</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--muted)' }}>{DIAS_PROPIOS_TOTAL}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Total</div>
            </div>
          </div>
          <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3 }}>
            <div style={{ height: '100%', background: 'var(--accent)', width: `${Math.min((diasPropiosUsados / DIAS_PROPIOS_TOTAL) * 100, 100)}%`, borderRadius: 3, transition: 'width .3s' }} />
          </div>
        </div>
      </div>

      {/* Formulario solicitud */}
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

      {/* Calendario anual */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setAnio(a => a - 1)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>←</button>
            <span style={{ fontSize: 15, fontWeight: 'bold' }}>{anio}</span>
            <button onClick={() => setAnio(a => a + 1)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>→</button>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--muted)' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#8fb8a055', border: '1px solid #8fb8a0', marginRight: 4 }} />Aprobada</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#c8a96e55', border: '1px solid #c8a96e', marginRight: 4 }} />Pendiente</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#c0604a55', border: '1px solid #c0604a', marginRight: 4 }} />Rechazada</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {Array.from({ length: 12 }, (_, i) => renderMes(i))}
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Mis solicitudes</div>
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

// ─── Horarios ────────────────────────────────────────────────────────────────
function EmpHorarios({ token }) {
  const [turnos, setTurnos] = useState([])
  const [mes, setMes]       = useState(new Date().getMonth())
  const [anio, setAnio]     = useState(new Date().getFullYear())

  useEffect(() => { api.getTurnos(token).then(setTurnos).catch(() => {}) }, [token])

  const mesesNombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const diasSemana   = ['L','M','X','J','V','S','D']

  // Calcula horas diarias de un turno (hora_entrada y hora_salida son strings "HH:MM:SS")
  function horasTurno(t) {
    if (!t?.hora_entrada || !t?.hora_salida) return 0
    const [eh, em] = t.hora_entrada.split(':').map(Number)
    const [sh, sm] = t.hora_salida.split(':').map(Number)
    return ((sh * 60 + sm) - (eh * 60 + em)) / 60
  }

  // Dado un día del mes (1-based), devuelve el turno activo ese día
  // dia_semana: 0=Dom,1=Lun...6=Sab → convertimos a 1=Lun...7=Dom
  function turnoDelDia(dia) {
    const dow = new Date(anio, mes, dia).getDay() // 0=Dom
    const dowISO = dow === 0 ? 7 : dow            // 1=Lun...7=Dom
    return turnos.find(t => (t.dias_semana || [1,2,3,4,5]).includes(dowISO)) || null
  }

  const totalDias = new Date(anio, mes + 1, 0).getDate()

  // Horas teóricas del mes
  const horasMes = Array.from({ length: totalDias }, (_, i) => {
    const t = turnoDelDia(i + 1)
    return t ? horasTurno(t) : 0
  }).reduce((a, b) => a + b, 0)

  // Horas teóricas de la semana actual
  const hoy = new Date()
  const dowHoy = hoy.getDay() || 7
  const lunes  = new Date(hoy); lunes.setDate(hoy.getDate() - dowHoy + 1)
  const horasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes); d.setDate(lunes.getDate() + i)
    if (d.getMonth() !== mes || d.getFullYear() !== anio) {
      // Si el día cae fuera del mes seleccionado, calculamos igual por día de semana
      const dow = d.getDay() === 0 ? 7 : d.getDay()
      const t = turnos.find(t2 => (t2.dias_semana || [1,2,3,4,5]).includes(dow))
      return t ? horasTurno(t) : 0
    }
    const t = turnoDelDia(d.getDate())
    return t ? horasTurno(t) : 0
  }).reduce((a, b) => a + b, 0)

  const primerDia = (new Date(anio, mes, 1).getDay() || 7) - 1

  return (
    <div>
      <SH title='Mis horarios' sub={turnos.length > 0 ? turnos.map(t => t.nombre).join(', ') : 'Sin turno asignado'} />

      {turnos.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          No tienes ningún turno asignado. Contacta con tu administrador.
        </div>
      ) : (
        <>
          {/* Resumen del turno */}
          {turnos.map(t => (
            <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 28 }}>🕐</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{t.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {t.hora_entrada?.slice(0,5)} – {t.hora_salida?.slice(0,5)}
                  <span style={{ marginLeft: 10, color: 'var(--accent)' }}>{horasTurno(t).toFixed(1)}h / día</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {(t.dias_semana || [1,2,3,4,5]).map(d => ['','Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][d]).join(' · ')}
                </div>
              </div>
            </div>
          ))}

          {/* Tarjetas horas teóricas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Horas teóricas · Semana actual</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{horasSemana.toFixed(1)}h</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Horas teóricas · {mesesNombres[mes]}</div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--accent2)', fontVariantNumeric: 'tabular-nums' }}>{horasMes.toFixed(1)}h</div>
            </div>
          </div>

          {/* Calendario mensual con horas por día */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button onClick={() => { if (mes===0){setMes(11);setAnio(a=>a-1)}else setMes(m=>m-1) }} style={{ background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',padding:'4px 12px',borderRadius:4,cursor:'pointer' }}>←</button>
              <span style={{ fontSize: 15, fontWeight: 'bold' }}>{mesesNombres[mes]} {anio}</span>
              <button onClick={() => { if (mes===11){setMes(0);setAnio(a=>a+1)}else setMes(m=>m+1) }} style={{ background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',padding:'4px 12px',borderRadius:4,cursor:'pointer' }}>→</button>
            </div>

            {/* Cabecera días semana */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
              {diasSemana.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', padding: '4px 0', fontWeight: 'bold' }}>{d}</div>
              ))}
            </div>

            {/* Días */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {Array.from({ length: primerDia }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: totalDias }, (_, i) => {
                const dia   = i + 1
                const t     = turnoDelDia(dia)
                const horas = t ? horasTurno(t) : 0
                const fecha = `${anio}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                const esHoy = fecha === today()
                const esFinde = [6,0].includes(new Date(anio, mes, dia).getDay())
                return (
                  <div key={dia} style={{ borderRadius: 6, padding: '6px 4px', textAlign: 'center', background: esHoy ? 'rgba(200,169,110,0.15)' : horas > 0 ? 'var(--surface2)' : 'transparent', border: esHoy ? '1px solid var(--accent)' : '1px solid transparent', minHeight: 52 }}>
                    <div style={{ fontSize: 11, color: esHoy ? 'var(--accent)' : esFinde ? 'var(--muted)' : 'var(--text)', fontWeight: esHoy ? 'bold' : 'normal', marginBottom: 2 }}>{dia}</div>
                    {horas > 0 ? (
                      <div style={{ fontSize: 10, color: 'var(--accent2)', fontWeight: 'bold' }}>{horas % 1 === 0 ? horas : horas.toFixed(1)}h</div>
                    ) : (
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>–</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Calendario del equipo ────────────────────────────────────────────────────
function Calendario({ token }) {
  const [mes, setMes] = useState(new Date().getMonth())
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [aus, setAus] = useState([])
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const dias = ['L','M','X','J','V','S','D']

  useEffect(() => {
    const desde = `${anio}-${String(mes+1).padStart(2,'0')}-01`
    const hasta = `${anio}-${String(mes+1).padStart(2,'0')}-${new Date(anio,mes+1,0).getDate()}`
    api.getAusencias(token, { estado: 'aprobada', desde, hasta }).then(setAus).catch(() => {})
  }, [mes, anio, token])

  const primerDia = new Date(anio, mes, 1).getDay() || 7
  const diasMes   = new Date(anio, mes+1, 0).getDate()

  function ausDelDia(dia) {
    const f = `${anio}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    return aus.filter(a => a.desde <= f && a.hasta >= f)
  }

  return (
    <div>
      <SH title='Calendario del equipo' />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => { if (mes===0){setMes(11);setAnio(a=>a-1)}else setMes(m=>m-1) }} style={{ background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',padding:'6px 12px',borderRadius:4 }}>←</button>
        <span style={{ fontSize:15,fontWeight:'bold',flex:1,textAlign:'center' }}>{meses[mes]} {anio}</span>
        <button onClick={() => { if (mes===11){setMes(0);setAnio(a=>a+1)}else setMes(m=>m+1) }} style={{ background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',padding:'6px 12px',borderRadius:4 }}>→</button>
      </div>
      <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:16,marginBottom:20 }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:8 }}>
          {dias.map(d=><div key={d} style={{ textAlign:'center',fontSize:10,color:'var(--muted)',padding:'4px 0' }}>{d}</div>)}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2 }}>
          {Array.from({length:primerDia-1}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:diasMes}).map((_,i)=>{
            const dia=i+1; const ad=ausDelDia(dia)
            const esHoy=new Date().getDate()===dia&&new Date().getMonth()===mes&&new Date().getFullYear()===anio
            return (
              <div key={dia} style={{ minHeight:36,borderRadius:4,padding:3,background:esHoy?'rgba(200,169,110,0.15)':ad.length>0?'rgba(143,184,160,0.08)':'transparent',border:esHoy?'1px solid var(--accent)':'1px solid transparent' }}>
                <div style={{ fontSize:11,textAlign:'center',color:esHoy?'var(--accent)':'var(--text)',fontWeight:esHoy?'bold':'normal' }}>{dia}</div>
                {ad.slice(0,2).map((a,j)=><div key={j} style={{ fontSize:9,background:COLORS[j]+'33',color:COLORS[j],borderRadius:2,padding:'1px 3px',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.empleados?.nombre?.split(' ')[0]}</div>)}
                {ad.length>2&&<div style={{ fontSize:9,color:'var(--muted)' }}>+{ad.length-2}</div>}
              </div>
            )
          })}
        </div>
      </div>
      {aus.length>0&&(
        <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:16 }}>
          <div style={{ fontSize:10,letterSpacing:2,color:'var(--muted)',marginBottom:12,textTransform:'uppercase' }}>Ausencias del mes</div>
          {aus.map(a=>(
            <div key={a.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid var(--border)' }}>
              <Av name={a.empleados?.nombre||'?'} size={26}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,fontWeight:'bold' }}>{a.empleados?.nombre}</div>
                <div style={{ fontSize:11,color:'var(--muted)' }}>{a.tipo}</div>
              </div>
              <div style={{ fontSize:11,color:'var(--muted)',textAlign:'right' }}>
                <div>{fmtDate(a.desde)}</div><div>{fmtDate(a.hasta)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {aus.length===0&&<Empty txt='Sin ausencias este mes'/>}
    </div>
  )
}

// ─── Documentos ───────────────────────────────────────────────────────────────
function EmpDocumentos({ token }) {
  const [docs, setDocs] = useState([])
  useEffect(() => { api.getDocumentos(token).then(setDocs).catch(() => {}) }, [token])
  return (
    <div>
      <SH title='Mis documentos' sub={`${docs.length} archivos`} />
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12 }}>
        {docs.map(d=>(
          <div key={d.id} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:16 }}>
            <div style={{ fontSize:28,marginBottom:10 }}>📄</div>
            <div style={{ fontSize:14,fontWeight:'bold',marginBottom:4 }}>{d.nombre}</div>
            {d.tipo&&<Badge label={d.tipo} c='var(--accent)'/>}
            {d.descripcion&&<div style={{ fontSize:11,color:'var(--muted)',marginTop:6 }}>{d.descripcion}</div>}
            <div style={{ fontSize:10,color:'var(--muted)',marginTop:8 }}>{fmtDate(d.created_at)}</div>
          </div>
        ))}
      </div>
      {docs.length===0&&<Empty txt='El admin aún no ha añadido documentos'/>}
    </div>
  )
}

// Export correcto: el wrapper con el modal de pausa
export default EmpleadoWrapper
