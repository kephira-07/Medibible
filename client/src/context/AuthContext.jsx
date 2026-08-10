import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'medibible_auth'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  })

  // localStorage.token est lu séparément par l'intercepteur axios (services/api.js)
  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
      localStorage.setItem('medibible_token', auth.token)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('medibible_token')
    }
  }, [auth])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setAuth(data)
    return data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    setAuth(data)
    return data
  }, [])

  const logout = useCallback(() => setAuth(null), [])

  return (
    <AuthContext.Provider
      value={{ user: auth?.user ?? null, token: auth?.token ?? null, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
