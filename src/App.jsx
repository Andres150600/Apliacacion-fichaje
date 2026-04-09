import { useState, useEffect } from 'react'
import Login from './components/Login'
import Admin from './components/Admin'
import Empleado from './components/Empleado'

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('login')
  const [toast, setToast] = useState(null)
  const [dark, setDark] = useState(true)
  const [loginTime, setLoginTime] = useState(null)

  useEffect(() => { document.body.className = dark ? 'dark' : 'light' }, [dark])

  useEffect(() => {
    if (!user || !loginTime) return
    const id = setInterval(() => {
      if (Date.now() - loginTime > 8 * 3600000) {
        setUser(null); setView('login'); setLoginTime(null)
        setToast({ msg: 'Sesión expirada, vuelve a iniciar sesión', type: 'err' })
        setTimeout(() => setToast(null), 4000)
      }
    }, 60000)
    return () => clearInterval(id)
  }, [user, loginTime])

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }
  const login = u => { setUser(u); setLoginTime(Date.now()); setView(u.es_admin ? 'admin' : 'emp') }
  const logout = () => { setUser(null); setView('login'); setLoginTime(null) }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, background: toast.type === 'ok' ? 'var(--accent2)' : 'var(--danger)', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 'bold' }}>
          {toast.msg}
        </div>
      )}
      {view === 'login' && <Login onLogin={login} toast={showToast} dark={dark} toggleDark={() => setDark(d => !d)} />}
      {view === 'admin' && user && <Admin user={user} onLogout={logout} toast={showToast} dark={dark} toggleDark={() => setDark(d => !d)} />}
      {view === 'emp' && user && <Empleado user={user} onLogout={logout} toast={showToast} dark={dark} toggleDark={() => setDark(d => !d)} />}
    </div>
  )
}
