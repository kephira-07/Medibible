import axios from 'axios'

// En local, VITE_API_URL est absent : on garde le chemin relatif '/api',
// géré par le proxy Vite (vite.config.js). En production, le client et le
// serveur sont sur des domaines différents, donc VITE_API_URL doit pointer
// vers l'URL réelle du serveur déployé (ex: https://medibible-api.onrender.com).
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

const api = axios.create({ baseURL })

function readSessionToken() {
  try {
    return sessionStorage.getItem('medibible_access_token')
  } catch {
    return null
  }
}

function readRefreshToken() {
  try {
    return localStorage.getItem('medibible_refresh_token')
  } catch {
    return null
  }
}

api.interceptors.request.use((config) => {
  const token = readSessionToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isUnauthorized = error.response?.status === 401
    const shouldRetry = !originalRequest?._retry && !originalRequest?.url?.includes('/auth/refresh')

    if (isUnauthorized && shouldRetry) {
      const refreshToken = readRefreshToken()
      if (!refreshToken) {
        return Promise.reject(error)
      }

      try {
        originalRequest._retry = true
        const { data } = await api.post('/auth/refresh', { refreshToken })

        sessionStorage.setItem('medibible_access_token', data.token)
        localStorage.setItem('medibible_refresh_token', data.refreshToken)
        localStorage.setItem(
          'medibible_auth',
          JSON.stringify({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
          })
        )

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return api(originalRequest)
      } catch {
        sessionStorage.removeItem('medibible_access_token')
        localStorage.removeItem('medibible_refresh_token')
        localStorage.removeItem('medibible_auth')
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
