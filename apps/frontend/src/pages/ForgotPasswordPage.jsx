import { ArrowLeft, Mail, Send } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import LanguageToggle from '../components/LanguageToggle'
import { useLanguage } from '../i18n'

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    setMessage('')
    setError('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError(t('Use a valid email address.'))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${url}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || t('Could not send password reset email.'))
      }

      setMessage(data.message)
    } catch (requestError) {
      console.error('Password reset request failed:', requestError)
      setError(requestError.message || t('Could not send password reset email.'))
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
                <p className="text-sm text-slate-500">{t('Password recovery')}</p>
              </div>
              <div className="ml-auto">
                <LanguageToggle />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-950">{t('Reset password')}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {t('Enter your account email and we will send a password reset link.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700">{t('email')}</label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="name@astanait.edu.kz"
                />
              </div>
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
              <Send className="h-4 w-4" />
              {isSubmitting ? t('Sending...') : t('Send reset link')}
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
