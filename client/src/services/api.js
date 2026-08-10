import axios from 'axios'

// En local, VITE_API_URL est absent : on garde le chemin relatif '/api',
// géré par le proxy Vite (vite.config.js). En production, le client et le
// serveur sont sur des domaines différents, donc VITE_API_URL doit pointer
// vers l'URL réelle du serveur déployé (ex: https://medibible-api.onrender.com).
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medibible_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
