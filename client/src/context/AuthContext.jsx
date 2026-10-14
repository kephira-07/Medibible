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

function safeReadSessionStorage(key) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeWriteStorage(storage, key, value) {
  try {
    storage.setItem(key, value)
  } catch {
    // Some mobile browsers disable storage in private browsing mode.
  }
}

function safeRemoveStorage(storage, key) {
  try {
    storage.removeItem(key)
  } catch {
    // Storage may be unavailable or already blocked by the browser.
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
      safeWriteStorage(localStorage, STORAGE_KEY, JSON.stringify(auth))
      safeWriteStorage(sessionStorage, SESSION_ACCESS_KEY, auth.token)
      safeWriteStorage(localStorage, REFRESH_KEY, auth.refreshToken)
    } else {
      safeRemoveStorage(localStorage, STORAGE_KEY)
      safeRemoveStorage(sessionStorage, SESSION_ACCESS_KEY)
      safeRemoveStorage(localStorage, REFRESH_KEY)
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

  // Met à jour l'utilisateur en mémoire sans repasser par un login complet —
  // utilisé après un changement de mot de passe (mustChangePassword: false).
  const updateUser = useCallback((partialUser) => {
    setAuth((prev) => (prev ? { ...prev, user: { ...prev.user, ...partialUser } } : prev))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user: auth?.user ?? null,
        token: auth?.token ?? safeReadSessionStorage(SESSION_ACCESS_KEY),
        refreshToken: auth?.refreshToken ?? safeReadStorage(REFRESH_KEY) ?? null,
        login,
        register,
        logout,
        updateUser,
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
