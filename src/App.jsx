import { useState, useEffect, useCallback } from 'react'
import Login from './components/Login'
import Admin from './components/Admin'
import Empleado from './components/Empleado'
import { api, warmupBackend } from './lib/api'

function loadSession() {
  try {
    const s = sessionStorage.getItem('wc_session')
    if (!s) return {}
    const { user, token, loginTime } = JSON.parse(s)
    if (Date.now() - loginTime > 8 * 3600000) { sessionStorage.removeItem('wc_session'); return {} }
    return { user, token, loginTime }
  } catch { return {} }
}

export default function App() {
  const saved = loadSession()
  const [user, setUser]       = useState(saved.user || null)
  const [token, setToken]     = useState(saved.token || null)
  const [view, setView]       = useState(saved.user ? (saved.user.es_admin ? 'admin' : 'emp') : 'login')
  const [toast, setToast]     = useState(null)
  const [dark, setDark]       = useState(true)
  const [loginTime, setLoginTime] = useState(saved.loginTime || null)

  // Estado global de fichaje (necesario para header siempre visible)
  const [fichajeHoy, setFichajeHoy]   = useState(null)
  const [pausas, setPausas]           = useState([])
  const [pausaActiva, setPausaActiva] = useState(null)

  useEffect(() => { document.body.className = dark ? 'dark' : 'light' }, [dark])

  // Despierta el backend en cuanto carga la app (Render free tier duerme)
  useEffect(() => { warmupBackend() }, [])

  // Expiración de sesión
  useEffect(() => {
    if (!user || !loginTime) return
    const id = setInterval(() => {
      if (Date.now() - loginTime > 8 * 3600000) {
        sessionStorage.removeItem('wc_session')
        setUser(null); setToken(null); setView('login'); setLoginTime(null)
        showToast('Sesión expirada, vuelve a iniciar sesión', 'err')
      }
    }, 60000)
    return () => clearInterval(id)
  }, [user, loginTime])

  // Refresca el fichaje de hoy y sus pausas
  const refreshFichaje = useCallback(async (tok) => {
    const t = tok || token
    if (!t) return
    try {
      const f = await api.getFichajeHoy(t)
      setFichajeHoy(f)
      if (f?.id) {
        const ps = await api.getPausas(t, f.id)
        setPausas(ps)
        setPausaActiva(ps.find(p => !p.fin) || null)
      } else {
        setPausas([])
        setPausaActiva(null)
      }
    } catch { /* si el backend duerme, silencioso */ }
  }, [token])

  // Carga inicial al entrar como empleado
  useEffect(() => {
    if (view === 'emp' && token) refreshFichaje(token)
  }, [view, token])

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const login = (empleado, tok) => {
    const lt = Date.now()
    sessionStorage.setItem('wc_session', JSON.stringify({ user: empleado, token: tok, loginTime: lt }))
    setUser(empleado); setToken(tok)
    setLoginTime(lt)
    setView(empleado.es_admin ? 'admin' : 'emp')
  }

  const logout = () => {
    sessionStorage.removeItem('wc_session')
    setUser(null); setToken(null); setView('login')
    setLoginTime(null); setFichajeHoy(null); setPausas([]); setPausaActiva(null)
  }

  const toggleDark = () => setDark(d => !d)

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, background: toast.type === 'ok' ? 'var(--accent2)' : 'var(--danger)', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}
      {view === 'login' && (
        <Login onLogin={login} toast={showToast} dark={dark} toggleDark={toggleDark} />
      )}
      {view === 'admin' && user && (
        <Admin user={user} token={token} onLogout={logout} toast={showToast} dark={dark} toggleDark={toggleDark} />
      )}
      {view === 'emp' && user && (
        <Empleado
          user={user} token={token} onLogout={logout} toast={showToast} dark={dark} toggleDark={toggleDark}
          fichajeHoy={fichajeHoy} pausas={pausas} pausaActiva={pausaActiva}
          onRefreshFichaje={refreshFichaje}
          onSetFichajeHoy={setFichajeHoy}
          onSetPausas={setPausas}
          onSetPausaActiva={setPausaActiva}
        />
      )}
    </div>
  )
}
