import { useCallback, useState } from 'react'
import api from '../services/api.js'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

// idle | subscribing | subscribed | unsupported | error
export function usePushNotifications() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    setStatus('subscribing')
    setError(null)
    try {
      let registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js')
      }

      const { data } = await api.get('/notifications/vapid-public-key')

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      })

      await api.post('/notifications/subscribe', subscription.toJSON())
      setStatus('subscribed')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Abonnement impossible.')
      setStatus('error')
    }
  }, [])

  return { status, error, subscribe }
}
