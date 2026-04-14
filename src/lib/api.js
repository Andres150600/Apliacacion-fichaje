const BASE = import.meta.env.VITE_API_URL

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

const get  = (path, token)        => req('GET',    path, null, token)
const post = (path, body, token)  => req('POST',   path, body, token)
const patch= (path, body, token)  => req('PATCH',  path, body, token)
const del  = (path, token)        => req('DELETE', path, null, token)

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

  // Turnos
  getTurnos:     (token)               => get('/turnos', token),
  postTurno:     (token, data)         => post('/turnos', data, token),
  deleteTurno:   (token, id)           => del(`/turnos/${id}`, token),

  // Informes
  getDashboard:  (token)               => get('/informes/dashboard', token),
  getInformes:   (token, mes, anio)    => get(`/informes?mes=${mes}&anio=${anio}`, token),
  getAlertas:    (token)               => get('/informes/alertas', token),

  // Documentos
  getDocumentos: (token)               => get('/documentos', token),
}
