import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket.js'
import { useAuth } from '../context/AuthContext.jsx'
import QuestionCard from '../components/quiz/QuestionCard.jsx'
import ScoreBoard from '../components/quiz/ScoreBoard.jsx'
import HostControls from '../components/quiz/HostControls.jsx'
import AudioRoom from '../components/audio/AudioRoom.jsx'
import Button from '../components/common/Button.jsx'
import AppHeader from '../components/common/AppHeader.jsx'
import FloatingBlobs from '../components/common/FloatingBlobs.jsx'

export default function LiveQuizRoom() {
  const { accessCode } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { socket, connected } = useSocket()
  const { user } = useAuth()

  const normalizedCode = accessCode?.toUpperCase()
  const displayName = location.state?.displayName || user?.name

  const [error, setError] = useState(null)
  const [joined, setJoined] = useState(null)
  const [phase, setPhase] = useState('lobby') // lobby | open | closed | ended
  const [question, setQuestion] = useState(null)
  const [correctOptionIds, setCorrectOptionIds] = useState([])
  const [bibleReference, setBibleReference] = useState('')
  const [leaderboard, setLeaderboard] = useState([])
  const [hasAnswered, setHasAnswered] = useState(false)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [lastResult, setLastResult] = useState(null)

  // Redirection si pas de pseudo
  useEffect(() => {
    if (!displayName) navigate('/join', { replace: true })
  }, [displayName, navigate])

  // Rejoint la session
  useEffect(() => {
    if (!connected || !displayName || !normalizedCode) return

    socket.emit('session:join', { accessCode: normalizedCode, displayName }, (res) => {
      if (res?.error) {
        setError(res.error)
        return
      }
      setJoined(res)
      setLeaderboard(res.leaderboard || [])
      if (res.activeQuestion) {
        setQuestion(res.activeQuestion)
        setPhase('open')
      } else if (res.session?.status === 'ended') {
        setPhase('ended')
      }
    })
  }, [connected, displayName, normalizedCode, socket])

  // Écoute des diffusions temps réel
  useEffect(() => {
    if (!socket) return

    const handleQuestionStarted = (q) => {
      setQuestion(q)
      setPhase('open')
      setHasAnswered(false)
      setAnsweredCount(0)
      setCorrectOptionIds([])
      setLastResult(null)
    }

    const handleAnswerReceived = ({ answeredCount: count }) => setAnsweredCount(count)

    const handleQuestionEnded = (payload) => {
      setPhase('closed')
      setCorrectOptionIds(payload.correctOptionIds || [])
      setBibleReference(payload.bibleReference || '')
      setLeaderboard(payload.leaderboard || [])
    }

    const handleParticipantsUpdate = (lb) => setLeaderboard(lb || [])

    const handleSessionEnded = (payload) => {
      setPhase('ended')
      setLeaderboard(payload?.leaderboard || [])
    }

    socket.on('quiz:questionStarted', handleQuestionStarted)
    socket.on('quiz:answerReceived', handleAnswerReceived)
    socket.on('quiz:questionEnded', handleQuestionEnded)
    socket.on('session:participantsUpdate', handleParticipantsUpdate)
    socket.on('quiz:sessionEnded', handleSessionEnded)

    return () => {
      socket.off('quiz:questionStarted', handleQuestionStarted)
      socket.off('quiz:answerReceived', handleAnswerReceived)
      socket.off('quiz:questionEnded', handleQuestionEnded)
      socket.off('session:participantsUpdate', handleParticipantsUpdate)
      socket.off('quiz:sessionEnded', handleSessionEnded)
    }
  }, [socket])

  const submitAnswer = useCallback(
    (selectedOptionIds) => {
      const sessionId = joined?.session?.id || joined?.session?._id
      socket.emit(
        'player:submitAnswer',
        { sessionId, selectedOptionIds },
        (res) => {
          if (res?.error) {
            setError(res.error)
            return
          }
          setHasAnswered(true)
          setLastResult(res)
        }
      )
    },
    [socket, joined]
  )

  const advance = useCallback(() => {
    const sessionId = joined?.session?.id || joined?.session?._id
    if (!sessionId) return

    socket.emit('host:nextQuestion', { sessionId }, (res) => {
      if (res?.error) setError(res.error)
    })
  }, [socket, joined])

  if (error) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-medi-cream px-4 text-center">
        <p className="text-medi-petrol">{error}</p>
        <Button onClick={() => navigate('/join')}>Retour</Button>
      </main>
    )
  }

  if (!joined) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-medi-cream">
        <p className="text-medi-petrol/60">Connexion à la session…</p>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center overflow-hidden bg-medi-cream px-4 py-10">
      <FloatingBlobs />
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-6">
        <AppHeader />

        <div className="text-center">
          <h1 className="text-xl font-bold text-medi-petrol">{joined.session.quizTitle}</h1>
          <div className="mt-2 inline-flex flex-col items-center gap-1">
            <span className="text-xs text-medi-petrol/50">
              {joined.isHost ? 'Code pour les participants' : 'Salle de jeu'}
            </span>
            <span className="rounded-2xl bg-medi-gold/20 px-4 py-1 text-lg font-bold tracking-[0.2em] text-medi-petrol">
              {normalizedCode}
            </span>
          </div>
        </div>

        <AudioRoom roomName={normalizedCode} displayName={displayName} isHost={joined.isHost} />

        {/* LOBBY */}
        {phase === 'lobby' && (
          <div className="w-full rounded-2xl border border-medi-petrol/10 bg-white/60 p-6 text-center shadow-sm backdrop-blur-md">
            <p className="animate-pulse font-medium text-medi-petrol">
              ⏳ En attente du démarrage par l'animateur…
            </p>
          </div>
        )}

        {/* QUESTION / RÉSULTAT DE LA QUESTION */}
        {(phase === 'open' || phase === 'closed') && question && (
          <div
            key={question.questionIndex || question._id}
            className="animate-fade-in-up flex w-full flex-col items-center gap-6"
          >
            {/* BANNIÈRE COLORÉE DE CONFIRMATION / RÉSULTAT */}
            {hasAnswered && lastResult && (
              <div
                className={`w-full rounded-2xl border-2 p-4 text-center transition-all duration-300 ${
                  lastResult.isCorrect
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-lg shadow-emerald-500/10'
                    : 'border-rose-400 bg-rose-50 text-rose-900 shadow-lg shadow-rose-500/10'
                }`}
              >
                {lastResult.isCorrect ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">🎯</span>
                    <p className="text-lg font-bold text-emerald-700">Excellente réponse !</p>
                    <span className="inline-block rounded-full bg-emerald-200/80 px-3 py-0.5 text-sm font-extrabold text-emerald-900">
                      +{lastResult.pointsEarned} pts
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">❌</span>
                    <p className="text-lg font-bold text-rose-700">Aïe, mauvaise réponse !</p>
                    <p className="text-xs text-rose-600">Pas de points pour cette question.</p>
                  </div>
                )}
              </div>
            )}

            {/* SI CLÔTURÉ ET SANS RÉPONSE */}
            {!hasAnswered && phase === 'closed' && (
              <div className="w-full rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center text-amber-900">
                <span className="text-xl">⏰</span>
                <p className="font-semibold">Temps écoulé !</p>
                <p className="text-xs opacity-80">Vous n'avez pas soumis de réponse à temps.</p>
              </div>
            )}

            <QuestionCard
              question={question}
              phase={phase}
              correctOptionIds={correctOptionIds}
              hasAnswered={hasAnswered}
              onSubmit={submitAnswer}
            />

            {phase === 'open' && (
              <p className="text-sm font-medium text-medi-petrol/60">
                👥 {answeredCount} réponse(s) enregistrée(s)
              </p>
            )}

            {phase === 'closed' && bibleReference && (
              <p className="animate-pop-in rounded-2xl border border-medi-gold/30 bg-medi-gold/15 px-5 py-3 text-center text-sm font-semibold text-medi-petrol">
                📖 Référence : <span className="underline">{bibleReference}</span>
              </p>
            )}

            {phase === 'closed' && <ScoreBoard leaderboard={leaderboard} />}
          </div>
        )}

        {/* FIN DU QUIZ */}
        {phase === 'ended' && (
          <div className="animate-fade-in-up flex w-full flex-col items-center gap-6 text-center">
            <div className="rounded-3xl border border-medi-gold/40 bg-white/80 p-6 shadow-xl backdrop-blur-md">
              <span className="text-4xl">🏆</span>
              <h2 className="mt-2 text-2xl font-black text-medi-petrol">Quiz terminé !</h2>
            </div>
            <ScoreBoard leaderboard={leaderboard} title="Classement final" />
          </div>
        )}

        {joined.isHost && phase !== 'ended' && <HostControls phase={phase} onNext={advance} />}
      </div>
    </main>
  )
}