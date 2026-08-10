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

  const displayName = location.state?.displayName || user?.name

  const [error, setError] = useState(null)
  const [joined, setJoined] = useState(null) // { session, isHost }
  const [phase, setPhase] = useState('lobby') // lobby | open | closed | ended
  const [question, setQuestion] = useState(null)
  const [correctOptionIds, setCorrectOptionIds] = useState([])
  const [bibleReference, setBibleReference] = useState('')
  const [leaderboard, setLeaderboard] = useState([])
  const [hasAnswered, setHasAnswered] = useState(false)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [lastResult, setLastResult] = useState(null)

  // Sans pseudo (arrivée directe sur l'URL sans passer par /join), on renvoie au formulaire
  useEffect(() => {
    if (!displayName) navigate('/join', { replace: true })
  }, [displayName, navigate])

  // Rejoint la session dès que le socket est connecté
  useEffect(() => {
    if (!connected || !displayName) return

    socket.emit('session:join', { accessCode, displayName }, (res) => {
      if (res.error) {
        setError(res.error)
        return
      }
      setJoined(res)
      setLeaderboard(res.leaderboard)
      if (res.activeQuestion) {
        setQuestion(res.activeQuestion)
        setPhase('open')
      } else if (res.session.status === 'ended') {
        setPhase('ended')
      }
    })
  }, [connected, displayName, accessCode, socket])

  // Écoute des diffusions temps réel
  useEffect(() => {
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
      setCorrectOptionIds(payload.correctOptionIds)
      setBibleReference(payload.bibleReference)
      setLeaderboard(payload.leaderboard)
    }

    const handleParticipantsUpdate = (lb) => setLeaderboard(lb)

    const handleSessionEnded = (payload) => {
      setPhase('ended')
      setLeaderboard(payload.leaderboard)
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
      socket.emit(
        'player:submitAnswer',
        { sessionId: joined.session.id, selectedOptionIds },
        (res) => {
          if (res.error) {
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
    socket.emit('host:nextQuestion', { sessionId: joined.session.id }, (res) => {
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
      <div className="relative z-10 flex w-full flex-col items-center gap-6">
      <AppHeader />

      <div className="text-center">
        <h1 className="text-xl font-bold text-medi-petrol">{joined.session.quizTitle}</h1>
        <div className="mt-2 inline-flex flex-col items-center gap-1">
          <span className="text-xs text-medi-petrol/50">
            {joined.isHost ? 'Donne ce code à tes participants' : 'Salle'}
          </span>
          <span className="rounded-2xl bg-medi-gold/20 px-4 py-1 text-lg font-bold tracking-[0.2em] text-medi-petrol">
            {accessCode.toUpperCase()}
          </span>
        </div>
      </div>

      <AudioRoom roomName={accessCode} displayName={displayName} />

      {phase === 'lobby' && (
        <p className="animate-fade-in-up text-medi-petrol/70">
          En attente du démarrage par l'animateur…
        </p>
      )}

      {(phase === 'open' || phase === 'closed') && question && (
        <div
          key={question.questionIndex}
          className="animate-fade-in-up flex w-full flex-col items-center gap-6"
        >
          <QuestionCard
            question={question}
            phase={phase}
            correctOptionIds={correctOptionIds}
            hasAnswered={hasAnswered}
            onSubmit={submitAnswer}
          />

          {phase === 'open' && (
            <p className="text-sm text-medi-petrol/50">{answeredCount} réponse(s) reçue(s)</p>
          )}

          {hasAnswered && phase === 'open' && lastResult && (
            <p
              className={`animate-pop-in text-sm font-semibold ${lastResult.isCorrect ? 'text-medi-green-deep' : 'text-medi-petrol/60'}`}
            >
              {lastResult.isCorrect ? `Bonne réponse ! +${lastResult.pointsEarned} pts` : 'Réponse enregistrée.'}
            </p>
          )}

          {phase === 'closed' && bibleReference && (
            <p className="animate-pop-in rounded-2xl bg-medi-gold/15 px-4 py-2 text-sm font-medium text-medi-petrol">
              📖 {bibleReference}
            </p>
          )}

          {phase === 'closed' && <ScoreBoard leaderboard={leaderboard} />}
        </div>
      )}

      {phase === 'ended' && (
        <div className="animate-fade-in-up flex w-full flex-col items-center gap-6">
          <h2 className="text-lg font-bold text-medi-petrol">Quiz terminé !</h2>
          <ScoreBoard leaderboard={leaderboard} title="Classement final" />
        </div>
      )}

      {joined.isHost && phase !== 'ended' && <HostControls phase={phase} onNext={advance} />}
      </div>
    </main>
  )
}
