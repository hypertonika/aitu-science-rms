import { ArrowLeft, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import LanguageToggle from '../components/LanguageToggle'
import { useLanguage } from '../i18n'

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ResetPasswordPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!token) {
      setError(t('Password reset link is missing a token.'))
      return
    }

    if (password.length < 8) {
      setError(t('Password must contain at least 8 characters.'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('Passwords do not match.'))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${url}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || t('Could not reset password.'))
      }

      setMessage(t('Password changed successfully. Redirecting to sign in...'))
      setTimeout(() => navigate('/login'), 1200)
    } catch (requestError) {
      console.error('Password reset failed:', requestError)
      setError(requestError.message || t('Could not reset password.'))
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
                <p className="text-sm text-slate-500">{t('Create a new password')}</p>
              </div>
              <div className="ml-auto">
                <LanguageToggle />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-950">{t('Set new password')}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {t('Use at least 8 characters. Existing refresh sessions will be invalidated.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700">{t('New password')}</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder={t('Minimum 8 characters')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">{t('Confirm password')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                autoComplete="new-password"
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder={t('Repeat password')}
              />
            </div>

            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

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
              <KeyRound className="h-4 w-4" />
              {isSubmitting ? t('Saving...') : t('Save new password')}
            </button>
          </form>

          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Back to sign in')}
          </Link>
        </section>
      </div>
    </main>
  )
}
