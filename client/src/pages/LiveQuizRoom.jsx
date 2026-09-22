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
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import { HiOutlineBookOpen } from 'react-icons/hi'
import { FaBullseye, FaTimes, FaUsers, FaTrophy, FaClock, FaShareAlt, FaChartBar } from 'react-icons/fa'

const MEDALS = ['🥇', '🥈', '🥉']
// Doit rester synchronisé avec MAX_PLAYERS_PER_SESSION côté serveur
// (server/src/utils/constants.js) — l'animateur coordonne, il ne compte pas.
const MAX_PLAYERS = 25
const AVATAR_COLORS = ['#C1613C', '#8B6F4E', '#D9924A', '#4C8B3E', '#006414']
function colorForName(name) {
  let hash = 0
  const str = name || ''
  for (let i = 0; i < str.length; i += 1) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
function initialFrom(name) {
  return name?.trim().charAt(0).toUpperCase() || '?'
}

export default function LiveQuizRoom() {
  const { accessCode } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { socket, connected, connectError, retryConnection } = useSocket()
  const { user } = useAuth()

  const normalizedCode = accessCode?.toUpperCase()
  const displayName = location.state?.displayName || user?.name
  const bergerName = location.state?.bergerName || ''

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
  const [shareCopied, setShareCopied] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  // Certains réseaux mobiles bloquent/cassent la connexion temps réel sans
  // jamais déclencher d'erreur explicite (voir SocketContext) : ce délai
  // transforme un blocage silencieux sur "Connexion à la session…" en
  // message actionnable avec bouton "Réessayer", plutôt que de laisser le
  // joueur bloqué indéfiniment sans aucun retour.
  const [joinTimedOut, setJoinTimedOut] = useState(false)

  useEffect(() => {
    if (joined || error) return
    setJoinTimedOut(false)
    const timer = setTimeout(() => setJoinTimedOut(true), 8000)
    return () => clearTimeout(timer)
  }, [joined, error, connected])

  // Redirection si pas de pseudo
  useEffect(() => {
    if (!displayName) navigate('/join', { replace: true })
  }, [displayName, navigate])

  // Rejoint la session
  useEffect(() => {
    if (!connected || !displayName || !normalizedCode) return

    socket.emit('session:join', { accessCode: normalizedCode, displayName, bergerName }, (res) => {
      if (res?.error) {
        setError(res.error)
        return
      }
      setJoined(res)
      setLeaderboard(res.leaderboard || [])
      // Réinitialise toute notification laissée par une question précédente :
      // une reconnexion (écran verrouillé, onglet mis en veille, réseau
      // instable côté mobile) redéclenche ce join sans jamais démonter le
      // composant, donc l'ancien lastResult/hasAnswered resterait sinon
      // affiché par-dessus la question retrouvée.
      setHasAnswered(false)
      setLastResult(null)
      setCorrectOptionIds([])
      if (res.activeQuestion) {
        setQuestion(res.activeQuestion)
        setPhase('open')
      } else if (res.session?.status === 'ended') {
        setPhase('ended')
      }
    })
  }, [connected, displayName, bergerName, normalizedCode, socket])

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
    (selectedOptionIds, elapsedMs) => {
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
          setLastResult({ ...res, elapsedMs })
        }
      )
    },
    [socket, joined]
  )

  const shareScore = useCallback(async () => {
    const myRank = leaderboard.findIndex((p) => p.displayName === displayName)
    const myScore = myRank >= 0 ? leaderboard[myRank].totalScore : null
    const text =
      myScore !== null
        ? `J'ai terminé ${myRank + 1}${myRank === 0 ? 'er' : 'e'} au quiz "${joined?.session?.quizTitle}" sur MediBible avec ${myScore} pts ! 🙌`
        : `On vient de jouer à "${joined?.session?.quizTitle}" sur MediBible !`
    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // partage annulé par l'utilisateur, rien à faire
      }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2000)
      } catch {
        // presse-papiers indisponible, on laisse l'utilisateur sans retour plutôt que planter
      }
    }
  }, [leaderboard, displayName, joined])

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
    const stuck = connectError || joinTimedOut
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-medi-cream px-4 text-center">
        <p className="text-medi-petrol/60">{stuck ? 'La connexion prend trop de temps…' : 'Connexion à la session…'}</p>
        {stuck && (
          <>
            <p className="max-w-xs text-sm text-medi-petrol/50">
              Ça arrive parfois avec la 4G/5G d'un opérateur mobile. Essaie de basculer sur le Wi-Fi si possible, ou réessaie.
            </p>
            <Button
              onClick={() => {
                setJoinTimedOut(false)
                retryConnection()
              }}
            >
              Réessayer
            </Button>
          </>
        )}
      </main>
    )
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center overflow-hidden bg-medi-cream px-4 py-10">
      <FloatingBlobs />
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-6">
        {/* Pendant que la partie est en cours, un clic sur le logo demande
            confirmation au lieu de faire quitter la session directement. */}
        <AppHeader onBrandClick={phase !== 'ended' ? () => setShowLeaveConfirm(true) : undefined} />

        <ConfirmDialog
          open={showLeaveConfirm}
          title="Quitter la session ?"
          message={
            joined.isHost
              ? 'Tu es en train d\'animer cette partie. Si tu quittes, les joueurs resteront en attente.'
              : 'Tu es en train de jouer. Si tu quittes maintenant, tu sortiras de la partie en cours.'
          }
          confirmLabel="Oui, quitter"
          cancelLabel="Rester ici"
          onConfirm={() => navigate('/')}
          onCancel={() => setShowLeaveConfirm(false)}
        />

        {!connected && (
          <div className="animate-pop-in w-full rounded-2xl border-2 border-medi-coral/40 bg-medi-coral/10 px-4 py-2.5 text-center text-sm font-semibold text-medi-coral">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-medi-coral" />
            Connexion perdue — tentative de reconnexion…
          </div>
        )}

        <div className="w-full rounded-2xl border-2 border-medi-border bg-medi-surface/90 p-5 text-center shadow-[0_18px_38px_rgba(22,50,62,0.08)]">
          <h1 className="text-xl font-extrabold text-medi-petrol">{joined.session.quizTitle}</h1>
          <div className="mt-2 inline-flex flex-col items-center gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-medi-petrol/55">
              {joined.isHost ? 'Code pour les participants' : 'Salle de jeu'}
            </span>
            <span className="rounded-2xl bg-medi-gold/15 px-4 py-1 text-lg font-extrabold tracking-[0.2em] text-medi-petrol">
              {normalizedCode}
            </span>
          </div>
        </div>

        <AudioRoom roomName={normalizedCode} displayName={displayName} isHost={joined.isHost} />

        {/* SALLE D'ATTENTE — avant que l'animateur ne lance une question */}
        {phase === 'lobby' && (
          <div className="animate-fade-in-up flex w-full flex-col items-center gap-6">
            <div className="w-full rounded-2xl border-2 border-medi-border bg-white p-6 text-center shadow-[0_18px_38px_rgba(22,50,62,0.08)]">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-medi-gold/15 text-2xl text-medi-gold">
                <FaClock />
              </span>
              <h2 className="mt-3 text-lg font-bold text-medi-petrol">
                {joined.isHost ? 'En attente de lancement' : "En attente que l'animateur lance le quiz"}
              </h2>
              <p className="mt-1 text-sm text-medi-petrol/60">
                {joined.isHost
                  ? 'Aucune question ne démarre automatiquement — utilise le bouton ci-dessous quand tu es prêt.'
                  : 'Les questions vont apparaître ici dès que l’animateur lancera la première.'}
              </p>
            </div>

            <div className="w-full rounded-2xl border-2 border-medi-border bg-medi-surface/95 p-5">
              <p className="mb-3 flex items-center justify-between text-sm font-extrabold text-medi-petrol">
                <span className="flex items-center gap-2"><FaUsers /> Joueurs connectés</span>
                <span className="text-xs font-semibold text-medi-petrol/45">{leaderboard.length} / {MAX_PLAYERS}</span>
              </p>
              {leaderboard.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {leaderboard.map((p) => (
                    <span
                      key={p.displayName}
                      className="flex items-center gap-2 rounded-full border-2 border-medi-border bg-white px-3 py-1.5 text-sm font-semibold text-medi-petrol"
                    >
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: colorForName(p.displayName) }}
                      >
                        {initialFrom(p.displayName)}
                      </span>
                      {p.displayName}
                      {!joined.isHost && p.displayName === displayName && <span className="text-medi-coral"> (Vous)</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-medi-petrol/50">Aucun joueur connecté pour le moment.</p>
              )}
            </div>
          </div>
        )}

        {phase === 'closed' && bibleReference && (
          <p className="animate-pop-in rounded-2xl bg-medi-gold/15 px-4 py-2 text-sm font-medium text-medi-petrol">
            <HiOutlineBookOpen className="inline-block mr-2" />{bibleReference}
          </p>
        )}

        {/* QUESTION / RÉSULTAT DE LA QUESTION */}
        {(phase === 'open' || phase === 'closed') && question && (
          <div
            key={question.questionIndex || question._id}
            className="animate-fade-in-up flex w-full flex-col items-center gap-6"
          >
            {/* BANNIÈRE COMPACTE DE CONFIRMATION / RÉSULTAT */}
            {hasAnswered && lastResult && (
              <div
                className={`animate-pop-in flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2 text-sm transition-all duration-300 ${
                  lastResult.isCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-rose-300 bg-rose-50 text-rose-800'
                }`}
              >
                {lastResult.isCorrect ? (
                  <>
                    <FaBullseye className="shrink-0 text-base" />
                    <p className="min-w-0 flex-1 truncate font-semibold">
                      Bonne réponse !{' '}
                      {typeof lastResult.elapsedMs === 'number' && (
                        <span className="font-normal text-emerald-700/70">
                          ({(lastResult.elapsedMs / 1000).toFixed(1)}s)
                        </span>
                      )}
                    </p>
                    <span className="shrink-0 rounded-full bg-emerald-200/80 px-2 py-0.5 text-xs font-extrabold text-emerald-900">
                      +{lastResult.pointsEarned}
                    </span>
                  </>
                ) : (
                  <>
                    <FaTimes className="shrink-0 text-base" />
                    <p className="font-semibold">Mauvaise réponse — pas de points.</p>
                  </>
                )}
              </div>
            )}

            {/* SI CLÔTURÉ ET SANS RÉPONSE */}
            {!hasAnswered && phase === 'closed' && (
              <div className="animate-pop-in flex w-full items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm text-amber-900">
                <FaClock className="shrink-0 text-base" />
                <p className="font-semibold">Temps écoulé — aucune réponse soumise.</p>
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
                <FaUsers className="inline-block mr-2" /> {answeredCount} réponse(s) enregistrée(s)
              </p>
            )}

            {phase === 'closed' && bibleReference && (
              <p className="animate-pop-in rounded-2xl border border-medi-gold/30 bg-medi-gold/15 px-5 py-3 text-center text-sm font-semibold text-medi-petrol">
                <HiOutlineBookOpen className="inline-block mr-2" />Référence : <span className="underline">{bibleReference}</span>
              </p>
            )}

            {phase === 'closed' && <ScoreBoard leaderboard={leaderboard} />}
          </div>
        )}

        {/* FIN DU QUIZ */}
        {phase === 'ended' && (() => {
          const myRank = leaderboard.findIndex((p) => p.displayName === displayName)
          const podium = leaderboard.slice(0, 3)
          const rest = leaderboard.slice(3)
          return (
            <div className="animate-fade-in-up flex w-full flex-col items-center gap-6 text-center">
              <div className="w-full rounded-2xl border-2 border-medi-gold/40 bg-white p-6 shadow-xl">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-medi-gold/15 text-3xl text-medi-gold mx-auto">
                  <FaTrophy />
                </span>
                <h2 className="mt-3 text-2xl font-black text-medi-petrol">Quiz terminé !</h2>
                <p className="mt-1 text-sm text-medi-petrol/60">
                  Bravo à toute la communauté pour ce moment partagé autour de la Parole.
                </p>

                {!joined.isHost && myRank >= 0 && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-medi-gold/15 px-4 py-1.5 text-sm font-extrabold text-medi-petrol">
                    {myRank === 0 ? '🥇 1ère place' : myRank === 1 ? '🥈 2e place' : myRank === 2 ? '🥉 3e place' : `#${myRank + 1}`}
                    <span className="text-medi-gold">{leaderboard[myRank].totalScore} pts</span>
                  </div>
                )}
              </div>

              <div className="w-full rounded-2xl border-2 border-medi-border bg-medi-surface/95 p-6 shadow-[0_18px_38px_rgba(22,50,62,0.1)]">
                <p className="mb-5 flex items-center justify-between text-sm font-extrabold text-medi-petrol">
                  <span>Podium de la fraternité</span>
                  <span className="text-xs font-semibold text-medi-petrol/45">{leaderboard.length} participant(s)</span>
                </p>

                {podium.length > 0 ? (
                  <div className="mb-5 flex items-end justify-center gap-3">
                    {[podium[1], podium[0], podium[2]].map((p, slot) => {
                      if (!p) return <div key={slot} className="w-20" />
                      const isFirst = slot === 1
                      const height = isFirst ? 'h-24' : slot === 0 ? 'h-16' : 'h-10'
                      const isMe = p.displayName === displayName
                      return (
                        <div key={p.displayName} className="flex w-24 flex-col items-center gap-1.5">
                          <span className="text-xl">{MEDALS[slot === 1 ? 0 : slot === 0 ? 1 : 2]}</span>
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ backgroundColor: colorForName(p.displayName) }}
                          >
                            {initialFrom(p.displayName)}
                          </div>
                          <p className="max-w-full truncate text-sm font-bold text-medi-petrol">
                            {p.displayName}{isMe && <span className="text-medi-coral"> (Vous)</span>}
                          </p>
                          <p className="text-xs font-extrabold text-medi-gold">{p.totalScore} pts</p>
                          <div className={`w-full rounded-t-lg bg-gradient-to-b from-medi-gold-light/60 to-medi-gold/20 ${height}`} />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mb-5 text-sm text-medi-petrol/50">Aucun participant.</p>
                )}

                {rest.length > 0 && (
                  <div className="space-y-2">
                    {rest.map((p, i) => (
                      <div
                        key={p.displayName}
                        className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                      >
                        <span className="font-semibold text-medi-petrol">
                          #{i + 4} {p.displayName}{p.displayName === displayName && <span className="text-medi-coral"> (Vous)</span>}
                        </span>
                        <span className="text-sm font-bold text-medi-green-deep">{p.totalScore} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col gap-3">
                <Button variant="primary" className="w-full text-base" onClick={() => navigate('/join')}>
                  Rejoindre une nouvelle partie
                </Button>
                <Button variant="outline" className="w-full" onClick={shareScore}>
                  <FaShareAlt className="mr-2 inline-block" />
                  {shareCopied ? 'Copié !' : 'Partager mon score'}
                </Button>
                {joined.isHost && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="flex items-center justify-center gap-2 text-sm font-semibold text-medi-petrol/60 transition hover:text-medi-petrol"
                  >
                    <FaChartBar /> Accéder au tableau de bord animateur
                  </button>
                )}
              </div>
            </div>
          )
        })()}

        {joined.isHost && phase !== 'ended' && <HostControls phase={phase} onNext={advance} />}
      </div>
    </main>
  )
}