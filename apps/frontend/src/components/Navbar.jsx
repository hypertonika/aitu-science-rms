import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const Navbar = ({ role }) => {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate('/login')
  }

  return (
    <nav className="bg-gray-800 p-4 border-b border-gray-700">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Brand - can be added here if needed */}
        {/* <Link to="/" className="text-white text-lg font-bold">Your Logo</Link> */}

        {/* Desktop Menu Links */}
        <div className="hidden md:flex space-x-6">
          <Link to={role === 'admin' ? "/home-admin" : "/home-user"} className="text-white hover:bg-gray-700 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200">
            Главная
          </Link>
          <Link to={role === 'admin' ? "/admin-publications" : "/publications"} className="text-white hover:bg-gray-700 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200">
            Публикации
          </Link>
          {role === 'admin' && (
            <Link to="/admin-users" className="text-white hover:bg-gray-700 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200">
              Все сотрудники
            </Link>
          )}
        </div>

        {/* Profile and Logout - Visible on Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/dashboard" className="text-white hover:bg-gray-700 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200">
            Профиль
          </Link>
          <button 
            onClick={handleLogout} 
            className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition duration-200"
          >
            Выйти
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex justify-end w-full">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:text-white focus:outline-none focus:text-white"
          >
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu - Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800 rounded-b-lg mt-2 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to={role === 'admin' ? "/home-admin" : "/home-user"} 
              className="text-white hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Главная
            </Link>
            <Link 
              to={role === 'admin' ? "/admin-publications" : "/publications"} 
              className="text-white hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Публикации
            </Link>
            {role === 'admin' && (
              <Link 
                to="/admin-users" 
                className="text-white hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Все сотрудники
              </Link>
            )}
            <Link 
              to="/dashboard" 
              className="text-white hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Профиль
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="mt-3 px-2">
              <button 
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} 
                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-base font-medium transition duration-200"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
