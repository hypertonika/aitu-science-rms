import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

const LoginPage = () => {
  const navigate = useNavigate()
  const [iin, setIIN] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const handleIINChange = (event) => {
    const input = event.target.value.trim().toLowerCase()
    const isNumeric = /^\d*$/.test(input)
    const isAdminAlias = 'admin'.startsWith(input)

    if ((isNumeric && input.length <= 12) || isAdminAlias) {
      setIIN(input)
      setError('')
      return
    }

    setError('Use a 12-digit IIN or the admin login.')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const isNumericIin = /^\d{12}$/.test(iin)
    const isAdmin = iin === 'admin'

    if (!isNumericIin && !isAdmin) {
      setError('Login must be a 12-digit IIN or admin.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iin, password }),
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
      console.error('Error during login:', error.message)
      setError(error.message || 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden rounded-lg bg-slate-950 p-8 text-white shadow-sm lg:block">
          <img src="/logo.png" alt="Astana IT University" className="h-14 w-14 object-contain" />
          <h1 className="mt-8 text-3xl font-bold leading-tight">AITU Science RMS</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Sign in to manage publications, submit records for review, and generate institutional reports.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-200">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Researcher workspace</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Administrator review queue</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Approved publication exports</div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Secure access</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Use your IIN or administrator login.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Login</label>
              <input
                type="text"
                value={iin}
                onChange={handleIINChange}
                required
                autoComplete="username"
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="12-digit IIN or admin"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Password</label>
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
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account yet?{' '}
            <Link to="/register" className="font-semibold text-blue-700 hover:text-blue-800">
              Create one
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
