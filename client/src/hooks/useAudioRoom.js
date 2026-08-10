import { useCallback, useEffect, useRef, useState } from 'react'
import { Room, RoomEvent, Track } from 'livekit-client'
import api from '../services/api.js'

// Traduit les erreurs navigateur getUserMedia (souvent obscures : "Permission
// denied" tel quel) en message actionnable pour l'utilisateur.
function describeMicError(err) {
  const name = err?.name || ''
  if (name === 'NotAllowedError' || /permission denied/i.test(err?.message || '')) {
    return "Micro refusé par le navigateur — clique sur le cadenas à côté de l'adresse du site, autorise le micro, puis recharge la page."
  }
  if (name === 'NotFoundError') {
    return 'Aucun micro détecté sur cet appareil.'
  }
  if (name === 'NotReadableError') {
    return 'Le micro est déjà utilisé par une autre application — ferme-la et réessaie.'
  }
  return err?.message || null
}

// Connexion LiveKit "brute" : on ne récupère que l'état (participants, qui
// parle, qui est coupé) et le flux audio — aucun composant d'UI imposé par
// le SDK, on dessine nous-mêmes les avatars.
export function useAudioRoom() {
  const roomRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [participants, setParticipants] = useState([])
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState(null)

  const syncParticipants = useCallback(() => {
    const room = roomRef.current
    if (!room) return

    const all = [room.localParticipant, ...Array.from(room.remoteParticipants.values())]
    setParticipants(
      all.map((p) => ({
        identity: p.identity,
        name: p.name || p.identity,
        isLocal: p === room.localParticipant,
        isSpeaking: p.isSpeaking,
        isMuted: !(p.isMicrophoneEnabled ?? true),
      }))
    )
  }, [])

  const connect = useCallback(
    async (roomName, displayName) => {
      setError(null)
      try {
        const { data } = await api.post('/audio/token', { roomName, displayName })

        const room = new Room()
        roomRef.current = room

        room
          .on(RoomEvent.ParticipantConnected, syncParticipants)
          .on(RoomEvent.ParticipantDisconnected, syncParticipants)
          .on(RoomEvent.ActiveSpeakersChanged, syncParticipants)
          .on(RoomEvent.TrackMuted, syncParticipants)
          .on(RoomEvent.TrackUnmuted, syncParticipants)
          .on(RoomEvent.TrackSubscribed, (track) => {
            if (track.kind === Track.Kind.Audio) {
              const el = track.attach()
              el.dataset.livekitAudio = 'true'
              document.body.appendChild(el)
            }
          })
          .on(RoomEvent.TrackUnsubscribed, (track) => {
            track.detach().forEach((el) => el.remove())
          })
          .on(RoomEvent.Disconnected, () => {
            setConnected(false)
            setParticipants([])
          })

        await room.connect(data.url, data.token)
        setConnected(true)

        // Une connexion réussie mais un micro refusé ne doit pas bloquer tout
        // le vocal : on reste connecté (on peut écouter), juste muet, avec un
        // message clair plutôt qu'un échec total.
        try {
          await room.localParticipant.setMicrophoneEnabled(true)
          setMuted(false)
        } catch (micErr) {
          setMuted(true)
          setError(describeMicError(micErr))
        }

        syncParticipants()
      } catch (err) {
        setError(err.response?.data?.message || describeMicError(err) || 'Connexion audio impossible.')
      }
    },
    [syncParticipants]
  )

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect()
    roomRef.current = null
    setConnected(false)
    setParticipants([])
  }, [])

  const toggleMute = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    const next = !muted
    try {
      await room.localParticipant.setMicrophoneEnabled(!next)
      setMuted(next)
      setError(null)
    } catch (err) {
      setMuted(true)
      setError(describeMicError(err))
    }
    syncParticipants()
  }, [muted, syncParticipants])

  useEffect(() => () => roomRef.current?.disconnect(), [])

  return { connected, participants, muted, error, connect, disconnect, toggleMute }
}
