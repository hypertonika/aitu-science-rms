import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import Dashboard from './pages/Dashboard'
import UserResume from './pages/UserResume'
import UserHome from './pages/UserHome'
import AdminHome from './pages/AdminHome'
import AdminPage from './pages/AdminPage'
import AdminPublications from './pages/AdminPublications'
import UserProfile from './pages/UserProfile'
import ErrorMessage from './components/ErrorMessage'
import RootLayout from './layouts/RootLayout'
import './global.css'
import './App.css'
import PublicationsPage from './pages/PublicationPage/PublicationsPage'
import ProtectedRoute from './components/ProtectedRoute'
import { LanguageProvider } from './i18n'

function App() {
  return (
    <LanguageProvider>
      <Router>
        <RootLayout>
        {/* <Navbar /> */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<ProtectedRoute roles={['user', 'admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/resume" element={<ProtectedRoute roles={['user']}><UserResume /></ProtectedRoute>} />
          <Route path="/home-user" element={<ProtectedRoute roles={['user']}><UserHome /></ProtectedRoute>} />
          <Route path="/publications" element={<ProtectedRoute roles={['user', 'admin']}><PublicationsPage /></ProtectedRoute>} />
          <Route path="/home-admin" element={<ProtectedRoute roles={['admin']}><AdminHome /></ProtectedRoute>} />
          <Route path="/admin-users" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="/admin-publications" element={<ProtectedRoute roles={['admin']}><AdminPublications /></ProtectedRoute>} />
          <Route path="/admin/user/:iin" element={<ProtectedRoute roles={['admin']}><UserProfile /></ProtectedRoute>} />
        </Routes>
        <ErrorMessage message={""} />
        </RootLayout>
      </Router>
    </LanguageProvider>
  )
}

export default App
