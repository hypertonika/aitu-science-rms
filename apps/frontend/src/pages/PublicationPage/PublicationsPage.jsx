import { createElement, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import {
  Download,
  ExternalLink,
  FileDown,
  FileSpreadsheet,
  FileText,
  Filter,
  Import,
  Search,
  Send,
  Trash2,
} from 'lucide-react'
import { makeAuthenticatedRequest } from '../../services/api'
import { generateUserReport } from '../../services/reportUtils'
import { getUserIdentifier } from '../../services/userUtils'
import Navbar from '../../components/Navbar'
import ErrorMessage from '../../components/ErrorMessage'
import ADD from './BREAD/ADD'
import EDIT from './BREAD/EDIT'
import Pagination from '../../components/Pagination/Pagination'
import CrossrefImport from '../../components/PublicationImport/CrossrefImport'
import { useLanguage } from '../../i18n'
import {
  allHigherSchools,
  publicationTypeMap,
  statusMap,
  visibilityMap,
} from '../../constants/publications'

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const itemsPerPage = 8

const statusStyles = {
  draft: 'border-slate-200 bg-slate-100 text-slate-700',
  submitted: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
}

export default function PublicationsPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [publications, setPublications] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [type, setType] = useState('')
  const [year, setYear] = useState('')
  const [school, setSchool] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    try {
      const iin = getUserIdentifier()
      localStorage.setItem('iin', iin)

      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate('/login')
        return
      }

      const decodedToken = jwtDecode(token)
      setIsAdmin(decodedToken.role === 'admin')
    } catch (error) {
      console.error('Could not read auth context:', error)
      setErrorMessage(t('Your session could not be verified. Please sign in again.'))
      navigate('/login')
    }
  }, [navigate, t])

  const resetPage = () => setCurrentPage(1)

  const fetchPublications = useCallback(async () => {
    try {
      setErrorMessage('')
      const iin = localStorage.getItem('iin')
      const response = await makeAuthenticatedRequest(
        `${url}/api/user/getPublications`,
        {
          method: 'GET',
          params: {
            iin,
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
      console.error('Publication loading failed:', error)
      setErrorMessage(t('Could not load publications. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }, [navigate, school, search, status, t, type, year])

  useEffect(() => {
    fetchPublications()
  }, [fetchPublications])

  useEffect(() => {
    resetPage()
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

  const handleGenerateUserReport = () => {
    try {
      const iin = getUserIdentifier()
      generateUserReport(url, navigate, iin)
    } catch (error) {
      console.error('Report generation failed:', error)
      setErrorMessage(t('Could not generate the publication report.'))
    }
  }

  const handleDeletePublication = async (id) => {
    if (!window.confirm(t('Delete this publication? This action cannot be undone.'))) {
      return
    }

    try {
      await makeAuthenticatedRequest(
        `${url}/api/admin/publications/${id}`,
        { method: 'DELETE' },
        navigate
      )
      setSuccessMessage(t('Publication deleted.'))
      fetchPublications()
    } catch (error) {
      console.error('Delete failed:', error)
      setErrorMessage(t('Could not delete the publication.'))
    }
  }

  const handleSubmitPublication = async (id) => {
    try {
      const response = await makeAuthenticatedRequest(
        `${url}/api/user/upload/${id}/submit`,
        { method: 'PATCH' },
        navigate
      )

      if (response?.status === 200) {
        setSuccessMessage(t('Publication submitted for review.'))
        fetchPublications()
      }
    } catch (error) {
      console.error('Submit failed:', error)
      setErrorMessage(t('Could not submit the publication for review.'))
    }
  }

  const handleExport = async (format) => {
    try {
      const response = await makeAuthenticatedRequest(
        `${url}/api/user/publications/export`,
        {
          method: 'GET',
          responseType: 'blob',
          params: { format },
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
      a.download = `my_publications.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(reportUrl)
      a.remove()
    } catch (error) {
      console.error('Export failed:', error)
      setErrorMessage(t('Could not export publications.'))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role={isAdmin ? 'admin' : 'user'} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <FileText className="h-4 w-4" />
                {t('Publication workspace')}
              </div>
              <h1 className="text-3xl font-bold text-slate-950">{t('Publications')}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {t('Search, filter, import, export and move records through the review workflow.')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowImport((value) => !value)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                <Import className="h-4 w-4" />
                {showImport ? t('Hide Crossref') : t('Crossref import')}
              </button>
              {!isAdmin && <ADD updateData={fetchPublications} />}
              {!isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={handleGenerateUserReport}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <FileDown className="h-4 w-4" />
                    {t('Report')}
                  </button>
                  <ExportButton label="CSV" icon={Download} onClick={() => handleExport('csv')} />
                  <ExportButton label="PDF" icon={FileText} onClick={() => handleExport('pdf')} />
                  <ExportButton label="Excel" icon={FileSpreadsheet} onClick={() => handleExport('xlsx')} />
                </>
              )}
            </div>
          </div>
        </section>

        <ErrorMessage message={errorMessage} />
        {successMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {successMessage}
          </div>
        )}

        {showImport && (
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <CrossrefImport onImportSuccess={fetchPublications} />
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
            <Filter className="h-4 w-4" />
            {t('Filters')}
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
          <StatusSummary label={t('All records')} value={publications.length} />
          <StatusSummary label={t('Submitted')} value={counts.submitted} tone="amber" />
          <StatusSummary label={t('Approved')} value={counts.approved} tone="emerald" />
          <StatusSummary label={t('Needs work')} value={counts.rejected + counts.draft} tone="rose" />
        </section>

        <section>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-lg border border-slate-200 bg-white" />
              ))}
            </div>
          ) : paginatedPublications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {paginatedPublications.map((publication) => (
                <PublicationCard
                  key={publication._id}
                  publication={publication}
                  isAdmin={isAdmin}
                  onDelete={handleDeletePublication}
                  onSubmit={handleSubmitPublication}
                  onRefresh={fetchPublications}
                  resetPage={resetPage}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center">
              <FileText className="mb-4 h-10 w-10 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-950">{t('No publications found')}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {t('Adjust filters or add your first publication record to begin the review workflow.')}
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

function PublicationCard({ publication, isAdmin, onDelete, onSubmit, onRefresh, resetPage }) {
  const { t } = useLanguage()
  const status = publication.status || 'draft'
  const canEdit = !isAdmin && status !== 'approved'
  const canSubmit = !isAdmin && ['draft', 'rejected'].includes(status)

  return (
    <article className="flex min-h-80 flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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
          {publication.doi && <InfoRow label="DOI" value={publication.doi} />}
          {publication.isbn && <InfoRow label="ISBN" value={publication.isbn} />}
          <InfoRow label={t('Visibility')} value={t(visibilityMap[publication.visibility] || publication.visibility || 'Private')} />
        </div>

        {publication.reviewComment && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-bold">{t('Review comment')}</p>
            <p className="mt-1 line-clamp-3 leading-6">{publication.reviewComment}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 p-3">
        {canEdit && <EDIT pub={publication} updateData={onRefresh} resetPage={resetPage} />}
        {canSubmit && (
          <button
            type="button"
            onClick={() => onSubmit(publication._id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            <Send className="h-3.5 w-3.5" />
            {t('Submit')}
          </button>
        )}
        {publication.file && (
          <a
            href={`${url}/${publication.file}`}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('File')}
          </a>
        )}
        <button
          type="button"
          onClick={() => onDelete(publication._id)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('Delete')}
        </button>
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
