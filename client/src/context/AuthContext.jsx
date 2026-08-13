import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'medibible_auth'
const SESSION_ACCESS_KEY = 'medibible_access_token'
const REFRESH_KEY = 'medibible_refresh_token'

function safeReadStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = safeReadStorage(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (auth) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
        sessionStorage.setItem(SESSION_ACCESS_KEY, auth.token)
        localStorage.setItem(REFRESH_KEY, auth.refreshToken)
      } catch {
        // Ignore storage quota issues and keep app running in degraded mode.
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(SESSION_ACCESS_KEY)
        localStorage.removeItem(REFRESH_KEY)
      } catch {
        // Ignore storage cleanup issues.
      }
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

  const logout = useCallback(async () => {
    const refreshToken = safeReadStorage(REFRESH_KEY)
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch {
        // ignore server-side logout errors and clear client state
      }
    }
    setAuth(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user: auth?.user ?? null,
        token: auth?.token ?? sessionStorage.getItem(SESSION_ACCESS_KEY) ?? null,
        refreshToken: auth?.refreshToken ?? safeReadStorage(REFRESH_KEY) ?? null,
        login,
        register,
        logout,
      }}
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
