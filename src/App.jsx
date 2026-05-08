import { useState, useEffect, useCallback } from 'react'
import Login from './components/Login'
import Admin from './components/Admin'
import Empleado from './components/Empleado'
import { api, warmupBackend } from './lib/api'

function loadSession() {
  try {
    const s = localStorage.getItem('wc_session')
    if (!s) return {}
    const { user, token, refreshToken, loginTime } = JSON.parse(s)
    // Expira tras 7 días (el refresh token del backend también dura 7 días)
    if (Date.now() - loginTime > 7 * 24 * 3600000) { localStorage.removeItem('wc_session'); return {} }
    return { user, token, refreshToken, loginTime }
  } catch { return {} }
}

export default function App() {
  const saved = loadSession()
  const [user, setUser]             = useState(saved.user || null)
  const [token, setToken]           = useState(saved.token || null)
  const [refreshToken, setRefreshToken] = useState(saved.refreshToken || null)
  const [view, setView]             = useState(saved.user ? (saved.user.es_admin ? 'admin' : 'emp') : 'login')
  const [toast, setToast]           = useState(null)
  const [dark, setDark]             = useState(true)
  const [loginTime, setLoginTime]   = useState(saved.loginTime || null)

  // Estado global de fichaje (necesario para header siempre visible)
  const [fichajeHoy, setFichajeHoy]   = useState(null)
  const [pausas, setPausas]           = useState([])
  const [pausaActiva, setPausaActiva] = useState(null)

  useEffect(() => { document.body.className = dark ? 'dark' : 'light' }, [dark])

  // Despierta el backend en cuanto carga la app (Render free tier duerme)
  useEffect(() => { warmupBackend() }, [])

  // Renueva el access token silenciosamente cada 12 min (expira en 15 min)
  useEffect(() => {
    if (!refreshToken) return
    const rt = refreshToken
    const id = setInterval(async () => {
      try {
        const { accessToken, empleado } = await api.refreshAccessToken(rt)
        setToken(accessToken)
        setUser(empleado)
        const s = JSON.parse(localStorage.getItem('wc_session') || '{}')
        localStorage.setItem('wc_session', JSON.stringify({ ...s, token: accessToken, user: empleado }))
      } catch {
        localStorage.removeItem('wc_session')
        localStorage.removeItem('wc_admin_tab')
        setUser(null); setToken(null); setRefreshToken(null); setView('login')
        setLoginTime(null); setFichajeHoy(null); setPausas([]); setPausaActiva(null)
        showToast('Sesión expirada, vuelve a iniciar sesión', 'err')
      }
    }, 12 * 60 * 1000)
    return () => clearInterval(id)
  }, [refreshToken])

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

  const login = (empleado, tok, rt) => {
    const lt = Date.now()
    localStorage.setItem('wc_session', JSON.stringify({ user: empleado, token: tok, refreshToken: rt, loginTime: lt }))
    setUser(empleado); setToken(tok); setRefreshToken(rt)
    setLoginTime(lt)
    setView(empleado.es_admin ? 'admin' : 'emp')
  }

  const logout = () => {
    if (refreshToken) api.logout(refreshToken)  // invalida en el servidor, fire-and-forget
    localStorage.removeItem('wc_session')
    localStorage.removeItem('wc_admin_tab')
    setUser(null); setToken(null); setRefreshToken(null); setView('login')
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
