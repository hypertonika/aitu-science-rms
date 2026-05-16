import { LogIn, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import LanguageToggle from '../components/LanguageToggle'
import { useLanguage } from '../i18n'

const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useLanguage()

  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const handleSubmit = async (event) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) && normalizedEmail !== 'admin') {
      setError('Use your institutional email address.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to sign in.')
      }

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)

      const decodedToken = jwtDecode(data.accessToken)
      navigate(decodedToken.role === 'admin' ? '/home-admin' : '/home-user')
    } catch (error) {
      console.error('Login failed:', error.message)
      setError(error.message || 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-3">
              <img src="/logo.png" alt="Astana IT University" className="h-10 w-10 object-contain" />
              <div>
                <p className="text-sm font-semibold text-slate-950">AITU Science RMS</p>
                <p className="text-sm text-slate-500">Research workspace</p>
              </div>
              <div className="ml-auto">
                <LanguageToggle />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-950">{t('signIn')}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use your university email to access publications, reports and review workflows.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700">{t('email')}</label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError('')
                  }}
                  required
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="name@astanait.edu.kz"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? 'Signing in...' : t('signIn')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('newResearcher')}{' '}
            <Link to="/register" className="font-semibold text-blue-700 hover:text-blue-800">
              {t('createAccount')}
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
