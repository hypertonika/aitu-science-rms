import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import LanguageToggle from '../components/LanguageToggle'
import { useLanguage } from '../i18n'

const HomePage = () => {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="flex min-h-screen items-center px-4 py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <img src="/logo.png" alt="Astana IT University" className="h-12 w-12 object-contain" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">AITU Science RMS</p>
                <p className="text-sm text-slate-500">Research Management System</p>
              </div>
              <div className="ml-auto">
                <LanguageToggle />
              </div>
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
              {t('homeTitle')}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {t('homeSubtitle')}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                {t('signIn')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
              >
                {t('createAccount')}
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">{t('dailyWork')}</h2>
            <div className="mt-5 divide-y divide-slate-200">
              <InfoRow title={t('researchers')} text={t('researchersText')} />
              <InfoRow title="Administrators" text={t('adminsText')} />
              <InfoRow title="Reports" text={t('reportsText')} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function InfoRow({ title, text }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  )
}

export default HomePage
