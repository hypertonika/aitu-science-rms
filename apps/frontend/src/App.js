import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import UserResume from './pages/UserResume';
import UserHome from './pages/UserHome';
import AdminHome from './pages/AdminHome';
import AdminPage from './pages/AdminPage';
import AdminPublications from './pages/AdminPublications';
import UserProfile from './pages/UserProfile';
import Navbar from './components/Navbar';
import ErrorMessage from './components/ErrorMessage';
import RootLayout from './layouts/RootLayout';
import './global.css';

function App() {
  return (
    <Router>
      <RootLayout>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resume" element={<UserResume />} />
          <Route path="/home-user" element={<UserHome />} />
          <Route path="/home-admin" element={<AdminHome />} />
          <Route path="/admin-users" element={<AdminPage />} />
          <Route path="/admin-publications" element={<AdminPublications />} />
          <Route path="/admin/user/:iin" element={<UserProfile />} />
        </Routes>
        <ErrorMessage message={""} />
      </RootLayout>
    </Router>
  );
}

export default App;
