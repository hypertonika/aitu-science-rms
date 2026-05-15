import { BookOpen, LayoutDashboard, LogOut, Menu, User, Users, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { createElement } from 'react'
import { useState } from 'react'

const navByRole = {
  admin: [
    { to: '/home-admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin-publications', label: 'Publications', icon: BookOpen },
    { to: '/admin-users', label: 'Researchers', icon: Users },
  ],
  user: [
    { to: '/home-user', label: 'Home', icon: LayoutDashboard },
    { to: '/publications', label: 'Publications', icon: BookOpen },
  ],
}

const Navbar = ({ role = 'user' }) => {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navItems = navByRole[role] || navByRole.user

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setIsMobileMenuOpen(false)
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    [
      'inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition',
      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
    ].join(' ')

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <NavLink to={role === 'admin' ? '/home-admin' : '/home-user'} className="flex items-center gap-3">
          <img src="/logo.png" alt="AITU" className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-950">AITU Science RMS</p>
            <p className="text-xs text-slate-500">{role === 'admin' ? 'Admin workspace' : 'Researcher workspace'}</p>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              {createElement(icon, { className: 'h-4 w-4' })}
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <NavLink to="/dashboard" className={linkClass}>
            <User className="h-4 w-4" />
            Profile
          </NavLink>
          <button
            onClick={handleLogout}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 md:hidden"
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="grid gap-1">
            {[...navItems, { to: '/dashboard', label: 'Profile', icon: User }].map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={linkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {createElement(icon, { className: 'h-4 w-4' })}
                {label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
