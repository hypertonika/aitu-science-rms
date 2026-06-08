import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Download,
  FileText,
  Mail,
  Phone,
  TrendingDown,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import { makeAuthenticatedRequest } from '../services/api'
import Navbar from '../components/Navbar'
import Pagination from '../components/Pagination/Pagination'
import { generateUserReport } from '../services/reportUtils'
import { publicationTypeMap, statusMap, visibilityMap } from '../constants/publications'
import { useLanguage } from '../i18n'

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const itemsPerPage = 8

const statusStyles = {
  draft: 'border-slate-200 bg-slate-100 text-slate-700',
  submitted: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
}

export default function UserProfile() {
  const navigate = useNavigate()
  const { iin } = useParams()
  const { t } = useLanguage()
  const [user, setUser] = useState(null)
  const [publications, setPublications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profileResponse = await makeAuthenticatedRequest(
          `${url}/api/admin/user/${iin}`,
          { method: 'GET' },
          navigate
        )

        if (profileResponse?.status === 200) {
          setUser(profileResponse.data.user)
        } else {
          navigate('/admin-users')
        }

        const publicationsResponse = await makeAuthenticatedRequest(
          `${url}/api/user/getPublications`,
          { method: 'GET', params: { iin } },
          navigate
        )

        if (publicationsResponse?.status === 200) {
          setPublications(publicationsResponse.data)
        }
      } catch (error) {
        console.error('User profile loading failed:', error)
        setMessage(t('Could not load this user profile.'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [navigate, iin, t])

  const counts = useMemo(() => {
    return publications.reduce(
      (acc, publication) => {
        const status = publication.status || 'draft'
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      { draft: 0, submitted: 0, approved: 0, rejected: 0 }
    )
  }, [publications])

  const paginatedPublications = useMemo(
    () => publications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [currentPage, publications]
  )

  const totalPages = Math.ceil(publications.length / itemsPerPage)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar role="admin" />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white" />
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar role="admin" />
        <main className="mx-auto flex min-h-96 w-full max-w-7xl items-center justify-center px-4 py-6">
          <p className="text-sm font-medium text-slate-500">{message || t('User not found.')}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="admin" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
            <div className="border-b border-slate-200 bg-slate-950 p-6 text-white lg:border-b-0 lg:border-r">
              <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border-4 border-white/20 bg-white/10">
                <img
                  src={user.profilePhoto ? `${url}${user.profilePhoto}` : '/default-profile.png'}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-5 text-center">
                <p className="text-xl font-bold">{user.fullName || t('Unnamed researcher')}</p>
                <p className="mt-1 text-sm text-slate-300">{user.email || user.iin}</p>
                <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
                  {user.role === 'admin' ? t('Admin') : t('Researcher')}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                    <UserRound className="h-4 w-4" />
                    {t('Researcher profile')}
                  </div>
                  <h1 className="text-3xl font-bold text-slate-950">{user.fullName || t('User profile')}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {t('Administrative view of profile details, identifiers and publication history.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => generateUserReport(url, navigate, iin)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" />
                  {t('DOCX report')}
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <ProfileField label={t('Email')} value={user.email} icon={Mail} />
                <ProfileField label={t('Phone')} value={user.phone} icon={Phone} />
                <ProfileField label={t('Higher school')} value={user.higherSchool ? t(user.higherSchool) : ''} />
                <ProfileField label={t('Visibility')} value={t(visibilityMap[user.profileVisibility] || 'Institutional')} />
                <ProfileField label="ORCID" value={user.orcid} />
                <ProfileField label={t('Scopus Author ID')} value={user.scopusId} />
                <ProfileField label={t('Web of Science ID')} value={user.wosId} />
                <ProfileField label={t('Research area')} value={user.researchArea} wide />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label={t('All publications')} value={publications.length} />
          <SummaryCard label={t('Submitted')} value={counts.submitted} tone="amber" />
          <SummaryCard label={t('Approved')} value={counts.approved} tone="emerald" />
          <SummaryCard label={t('Rejected')} value={counts.rejected} tone="rose" />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <TrendCard user={user} />
          <PredictionCard user={user} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-950">{t('Publication history')}</h2>
              <p className="text-sm text-slate-500">{t('Records associated with this user account.')}</p>
            </div>
          </div>

          {paginatedPublications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {paginatedPublications.map((publication) => (
                <PublicationCard key={publication._id} publication={publication} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 text-center">
              <FileText className="mb-4 h-10 w-10 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-950">{t('No publications yet')}</h3>
              <p className="mt-2 text-sm text-slate-500">{t('This user has not created publication records.')}</p>
            </div>
          )}
        </section>

        {publications.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </main>
    </div>
  )
}

function ProfileField({ label, value, icon: Icon, wide = false }) {
  const { t } = useLanguage()

  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-4 ${wide ? 'md:col-span-2' : ''}`}>
      <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">
        {value || t('Not specified')}
      </p>
    </div>
  )
}

function TrendCard({ user }) {
  const { t } = useLanguage()
  const status = user.publicationTrend?.status
  const isGrowing = status === 'growing'
  const isDeclining = status === 'declining'
  const Icon = isDeclining ? TrendingDown : TrendingUp
  const tone = isGrowing ? 'text-emerald-700 bg-emerald-50' : isDeclining ? 'text-rose-700 bg-rose-50' : 'text-slate-700 bg-slate-50'

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-950">{t('Publication trend')}</h2>
          <p className="text-sm text-slate-500">{t('Based on available publication years.')}</p>
        </div>
      </div>
      <p className="text-2xl font-bold capitalize text-slate-950">{status ? t(status) : t('No data')}</p>
      <p className="mt-2 text-sm text-slate-600">{user.publicationTrend?.rate || t('Not enough data for trend analysis.')}</p>
    </div>
  )
}

function PredictionCard({ user }) {
  const { t } = useLanguage()

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
          <TrendingUp className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-950">{t('Next-year estimate')}</h2>
          <p className="text-sm text-slate-500">{t('Simple projection from historical counts.')}</p>
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-950">{user.publicationPrediction?.count ?? 0}</p>
      <p className="mt-2 text-sm text-slate-600">
        {user.publicationPrediction?.basedOn || t('Not enough data for prediction.')}
      </p>
    </div>
  )
}

function PublicationCard({ publication }) {
  const { t } = useLanguage()
  const status = publication.status || 'draft'

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[status] || statusStyles.draft}`}>
          {t(statusMap[status] || status)}
        </span>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
          {t(publicationTypeMap[publication.publicationType] || 'Publication')}
        </span>
      </div>
      <h3 className="line-clamp-3 text-sm font-bold leading-6 text-slate-950" title={publication.title}>
        {publication.title}
      </h3>
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        <InfoRow label={t('Authors')} value={publication.authors} />
        <InfoRow label={t('Year')} value={publication.year} />
        <InfoRow label="DOI" value={publication.doi} />
        <InfoRow label={t('Visibility')} value={t(visibilityMap[publication.visibility] || publication.visibility || 'Private')} />
      </div>
    </article>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null

  return (
    <p className="grid grid-cols-[72px_1fr] gap-2">
      <span className="font-semibold text-slate-800">{label}</span>
      <span className="truncate" title={String(value)}>{value}</span>
    </p>
  )
}

function SummaryCard({ label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 inline-flex rounded-lg px-3 py-1 text-2xl font-bold ${tones[tone]}`}>
        {value}
      </p>
    </div>
  )
}
