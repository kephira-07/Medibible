import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import JoinSession from './pages/JoinSession.jsx'
import RequireAuth from './components/common/RequireAuth.jsx'
import BrandMark from './components/common/BrandMark.jsx'
import NotFound from './pages/NotFound.jsx'

// Les écrans d'accueil, de connexion et de saisie du code restent dans le
// bundle initial : c'est par là que tout le monde arrive. Le back-office et
// les salles live sont chargés à la demande — eux seuls embarquent
// livekit-client, inutile de le faire télécharger à un joueur qui n'a pas
// encore rejoint de session.
const LiveQuizRoom = lazy(() => import('./pages/LiveQuizRoom.jsx'))
const HostDashboard = lazy(() => import('./pages/HostDashboard.jsx'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'))
const QuizEditorPage = lazy(() => import('./pages/admin/QuizEditorPage.jsx'))
const MyQuizzesPage = lazy(() => import('./pages/admin/MyQuizzesPage.jsx'))
const MySessionsPage = lazy(() => import('./pages/admin/MySessionsPage.jsx'))
const ChangePasswordPage = lazy(() => import('./pages/admin/ChangePasswordPage.jsx'))

function RouteFallback() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-medi-cream px-4">
      <BrandMark className="animate-sway h-14 w-14" />
      <span className="sr-only">Chargement…</span>
    </main>
  )
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<JoinSession />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/changer-mot-de-passe"
          element={
            <RequireAuth>
              <ChangePasswordPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/quizzes"
          element={
            <RequireAuth>
              <MyQuizzesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/sessions"
          element={
            <RequireAuth>
              <MySessionsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/quizzes/new"
          element={
            <RequireAuth>
              <QuizEditorPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/quizzes/:id/edit"
          element={
            <RequireAuth>
              <QuizEditorPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/hostdashboard"
          element={
            <RequireAuth>
              <HostDashboard />
            </RequireAuth>
          }
        />
        <Route path="/session/:accessCode" element={<LiveQuizRoom />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App
