const BASE = import.meta.env.VITE_API_URL

// Despierta el backend en Render antes de que el usuario haga login
export const warmupBackend = () => fetch(`${BASE}/health`).catch(() => {})
const TTL = 30000
const _cache = new Map()

function cacheGet(key) {
  const e = _cache.get(key)
  if (!e || Date.now() - e.ts > TTL) { _cache.delete(key); return null }
  return e.data
}
function cacheSet(key, data) { _cache.set(key, { data, ts: Date.now() }) }
function cacheInvalidate(prefix) { _cache.forEach((_, k) => { if (k.startsWith(prefix)) _cache.delete(k) }) }

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error desconocido')
  return data
}

const get = (path, token) => {
  const key = path + (token?.slice(-10) || '')
  const cached = cacheGet(key)
  if (cached) return Promise.resolve(cached)
  return req('GET', path, null, token).then(d => { cacheSet(key, d); return d })
}
const post  = (path, body, token) => req('POST',   path, body, token).then(d => { cacheInvalidate(path.split('/')[1]); return d })
const patch = (path, body, token) => req('PATCH',  path, body, token).then(d => { cacheInvalidate(path.split('/')[1]); return d })
const del   = (path, token)       => req('DELETE', path, null, token).then(d => { cacheInvalidate(path.split('/')[1]); return d })

export const api = {
  // Auth
  login:         (nombre, pin)         => post('/auth/login', { nombre, pin }),

  // Fichajes
  getFichajeHoy: (token)               => get('/fichajes/hoy', token),
  getFichajes:   (token, params = {})  => get(`/fichajes?${new URLSearchParams(params)}`, token),
  postFichaje:   (token, data)         => post('/fichajes', data, token),
  patchFichaje:  (token, id, data)     => patch(`/fichajes/${id}`, data, token),

  // Ausencias
  getAusencias:  (token, params = {})  => get(`/ausencias?${new URLSearchParams(params)}`, token),
  postAusencia:  (token, data)         => post('/ausencias', data, token),
  patchAusencia: (token, id, estado)   => patch(`/ausencias/${id}`, { estado }, token),

  // Empleados
  getEmpleadosAdmin: (token)           => get('/empleados', token),
  getMe:             (token)           => get('/empleados/me', token),
  postEmpleado:      (token, data)     => post('/empleados', data, token),
  deleteEmpleado:    (token, id)       => del(`/empleados/${id}`, token),

  // Turnos / Jornadas
  getTurnos:      (token)                  => get('/turnos', token),
  postTurno:      (token, data)            => post('/turnos', data, token),
  patchTurno:     (token, id, data)        => patch(`/turnos/${id}`, data, token),
  deleteTurno:    (token, id)              => del(`/turnos/${id}`, token),
  asignarTurno:   (token, empId, turnoId)  => patch(`/empleados/${empId}/turno`, { turno_id: turnoId }, token),

  // Informes
  getDashboard:  (token)               => get('/informes/dashboard', token),
  getInformes:   (token, mes, anio)    => get(`/informes?mes=${mes}&anio=${anio}`, token),
  getAlertas:    (token)               => get('/informes/alertas', token),

  // Documentos
  getDocumentos: (token)               => get('/documentos', token),

  // Pausas
  postPausa:     (token, data)         => post('/pausas', data, token),
  patchPausa:    (token, id)           => patch(`/pausas/${id}`, {}, token),
  getPausas:     (token, fichaje_id)   => get(`/pausas?fichaje_id=${fichaje_id}`, token),

  // Fichajes manuales
  getFichajesManuales: (token)         => get('/fichajes-manuales', token),
  postFichajeManual:   (token, data)   => post('/fichajes-manuales', data, token),
  patchFichajeManual:  (token, id, estado) => patch(`/fichajes-manuales/${id}`, { estado }, token),

  // Tareas
  getTareas:   (token)               => get('/tareas', token),
  postTarea:   (token, data)         => post('/tareas', data, token),
  patchTarea:  (token, id, data)     => patch(`/tareas/${id}`, data, token),
  deleteTarea: (token, id)           => del(`/tareas/${id}`, token),

  // Festivos
  getFestivos:   (token, anio)       => get(`/festivos?anio=${anio}`, token),
  postFestivo:   (token, data)       => post('/festivos', data, token),
  deleteFestivo: (token, id)         => del(`/festivos/${id}`, token),
}
