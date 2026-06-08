import { createElement, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  Filter,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { makeAuthenticatedRequest } from '../services/api'
import { generateReport } from '../services/reportUtils'
import Navbar from '../components/Navbar'
import Pagination from '../components/Pagination/Pagination'
import { useLanguage } from '../i18n'
import {
  allHigherSchools,
  publicationTypeMap,
  statusMap,
  visibilityMap,
} from '../constants/publications'

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const itemsPerPage = 8

const statusStyles = {
  draft: 'border-slate-200 bg-slate-100 text-slate-700',
  submitted: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
}

export default function AdminPublications() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [type, setType] = useState('')
  const [year, setYear] = useState('')
  const [school, setSchool] = useState('')
  const [status, setStatus] = useState('submitted')
  const [search, setSearch] = useState('')
  const [publications, setPublications] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [reviewComments, setReviewComments] = useState({})
  const [message, setMessage] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setMessage('')
      const response = await makeAuthenticatedRequest(
        `${url}/api/admin/publications`,
        {
          method: 'GET',
          params: {
            publicationType: type || undefined,
            school: school || undefined,
            year: year || undefined,
            status: status || undefined,
            query: search || undefined,
          },
        },
        navigate
      )

      if (response?.status === 200) {
        setPublications(response.data)
      }
    } catch (error) {
      console.error('Admin publications loading failed:', error)
      setMessage(t('Could not load publications for review.'))
    } finally {
      setIsLoading(false)
    }
  }, [navigate, school, search, status, t, type, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setCurrentPage(1)
  }, [school, search, status, type, year])

  const counts = useMemo(() => {
    return publications.reduce(
      (acc, publication) => {
        const publicationStatus = publication.status || 'draft'
        acc[publicationStatus] = (acc[publicationStatus] || 0) + 1
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

  const handleReview = async (id, action) => {
    try {
      const comment = reviewComments[id]?.trim()
      await makeAuthenticatedRequest(
        `${url}/api/admin/publications/${id}/${action}`,
        {
          method: 'PATCH',
          data: {
            comment: comment || (action === 'approve' ? t('Approved') : t('Needs revision')),
          },
        },
        navigate
      )
      setReviewComments((current) => ({ ...current, [id]: '' }))
      setMessage(action === 'approve' ? t('Publication approved.') : t('Publication returned for revision.'))
      fetchData()
    } catch (error) {
      console.error('Publication review failed:', error)
      setMessage(t('Could not update publication status.'))
    }
  }

  const handleExport = async (format) => {
    try {
      const response = await makeAuthenticatedRequest(
        `${url}/api/admin/publications/export`,
        {
          method: 'GET',
          responseType: 'blob',
          params: { format, school: school || undefined },
        },
        navigate
      )
      const mimeTypes = {
        csv: 'text/csv',
        pdf: 'application/pdf',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
      const blob = new Blob([response.data], { type: mimeTypes[format] || mimeTypes.csv })
      const reportUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = reportUrl
      a.download = `approved_publications.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(reportUrl)
      a.remove()
    } catch (error) {
      console.error('Admin publication export failed:', error)
      setMessage(t('Could not export publications.'))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="admin" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                {t('Admin review queue')}
              </div>
              <h1 className="text-3xl font-bold text-slate-950">{t('Publication review')}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {t('Validate submitted research records, leave review comments and export approved publications.')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => generateReport(url, navigate, school || 'all')}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <FileDown className="h-4 w-4" />
                {t('DOCX report')}
              </button>
              <ExportButton label="CSV" icon={Download} onClick={() => handleExport('csv')} />
              <ExportButton label="PDF" icon={FileText} onClick={() => handleExport('pdf')} />
              <ExportButton label="Excel" icon={FileSpreadsheet} onClick={() => handleExport('xlsx')} />
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
            <Filter className="h-4 w-4" />
            {t('Review filters')}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Title, author, DOI')}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <input
              type="text"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder={t('Year')}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">{t('All types')}</option>
              {Object.entries(publicationTypeMap).map(([value, label]) => (
                <option key={value} value={value}>{t(label)}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">{t('All statuses')}</option>
              {Object.entries(statusMap).map(([value, label]) => (
                <option key={value} value={value}>{t(label)}</option>
              ))}
            </select>
            <select
              value={school}
              onChange={(event) => setSchool(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">{t('All schools')}</option>
              {allHigherSchools.map((schoolItem) => (
                <option key={schoolItem} value={schoolItem}>{t(schoolItem)}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatusSummary label={t('In current view')} value={publications.length} />
          <StatusSummary label={t('Awaiting review')} value={counts.submitted} tone="amber" />
          <StatusSummary label={t('Approved')} value={counts.approved} tone="emerald" />
          <StatusSummary label={t('Rejected')} value={counts.rejected} tone="rose" />
        </section>

        <section>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
              ))}
            </div>
          ) : paginatedPublications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {paginatedPublications.map((publication) => (
                <ReviewCard
                  key={publication._id}
                  publication={publication}
                  comment={reviewComments[publication._id] || ''}
                  onCommentChange={(value) =>
                    setReviewComments((current) => ({ ...current, [publication._id]: value }))
                  }
                  onReview={handleReview}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center">
              <ShieldCheck className="mb-4 h-10 w-10 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-950">{t('No publications in this view')}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {t('Try changing filters or check back after users submit publications for review.')}
              </p>
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

function ReviewCard({ publication, comment, onCommentChange, onReview }) {
  const { t } = useLanguage()
  const status = publication.status || 'draft'
  const canReview = status === 'submitted'

  return (
    <article className="flex min-h-96 flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[status] || statusStyles.draft}`}>
            {t(statusMap[status] || status)}
          </span>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
            {t(publicationTypeMap[publication.publicationType] || 'Publication')}
          </span>
        </div>

        <h2 className="line-clamp-3 text-base font-bold leading-6 text-slate-950" title={publication.title}>
          {publication.title}
        </h2>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <InfoRow label={t('Authors')} value={publication.authors} />
          <InfoRow label={t('Year')} value={publication.year} />
          <InfoRow label={t('Output')} value={publication.output} clamp />
          <InfoRow label="DOI" value={publication.doi} />
          <InfoRow label={t('Visibility')} value={t(visibilityMap[publication.visibility] || publication.visibility || 'Private')} />
          {publication.userId?.higherSchool && <InfoRow label={t('School')} value={t(publication.userId.higherSchool)} clamp />}
        </div>

        {publication.file && (
          <a
            href={`${url}/${publication.file}`}
            download
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FileText className="h-3.5 w-3.5" />
            {t('Download evidence')}
          </a>
        )}

        {publication.reviewComment && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-bold">{t('Previous review')}</p>
            <p className="mt-1 line-clamp-3 leading-6">{publication.reviewComment}</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-3">
        {canReview ? (
          <div className="space-y-3">
            <textarea
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder={t('Optional review comment')}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onReview(publication._id, 'approve')}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t('Approve')}
              </button>
              <button
                type="button"
                onClick={() => onReview(publication._id, 'reject')}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                <XCircle className="h-4 w-4" />
                {t('Reject')}
              </button>
            </div>
          </div>
        ) : (
          <p className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-500">
            {t('This record is not awaiting review.')}
          </p>
        )}
      </div>
    </article>
  )
}

function InfoRow({ label, value, clamp = false }) {
  if (!value) return null

  return (
    <p className="grid grid-cols-[72px_1fr] gap-2">
      <span className="font-semibold text-slate-800">{label}</span>
      <span className={clamp ? 'line-clamp-2' : 'truncate'} title={String(value)}>
        {value}
      </span>
    </p>
  )
}

function StatusSummary({ label, value, tone = 'blue' }) {
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

function ExportButton({ label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
    >
      {createElement(icon, { className: 'h-4 w-4' })}
      {label}
    </button>
  )
}
