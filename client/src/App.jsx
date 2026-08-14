import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import JoinSession from './pages/JoinSession.jsx'
import LiveQuizRoom from './pages/LiveQuizRoom.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import QuizEditorPage from './pages/admin/QuizEditorPage.jsx'
import RequireAuth from './components/common/RequireAuth.jsx'
import HostDashboard from './pages/HostDashboard.jsx'

function App() {
  return (
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
    </Routes>
  )
}

export default App
