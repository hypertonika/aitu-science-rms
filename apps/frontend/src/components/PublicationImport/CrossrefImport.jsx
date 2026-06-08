import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Import, Search } from 'lucide-react'
import { crossrefService } from '../../services/crossrefService'
import { makeAuthenticatedRequest } from '../../services/api'
import { useLanguage } from '../../i18n'

const ITEMS_PER_PAGE = 3
const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function CrossrefImport({ onImportSuccess }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [importingDoi, setImportingDoi] = useState(null)
  const [message, setMessage] = useState('')

  const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE)
  const currentItems = searchResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSearch = async (event) => {
    event.preventDefault()
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setMessage('')
    setCurrentPage(1)

    try {
      const results = await crossrefService.searchWorksByAuthor(searchQuery)
      setSearchResults(results)
      if (results.length === 0) {
        setMessage(t('No Crossref records found for this query.'))
      }
    } catch (error) {
      console.error('Crossref search failed:', error)
      setMessage(t('Crossref search failed. Please try another query.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublicationClick = (doi) => {
    if (!doi) return
    const doiUrl = doi.startsWith('http') ? doi : `https://doi.org/${doi}`
    window.open(doiUrl, '_blank')
  }

  const handleImportDraft = async (publication, event) => {
    event.stopPropagation()
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
      return
    }

    const formData = new FormData()
    formData.append('title', publication.title || '')
    formData.append('authors', publication.authors || '')
    formData.append('year', publication.year || new Date().getFullYear())
    formData.append('output', publication.output || publication.journal || '')
    formData.append('doi', publication.doi || '')
    formData.append('publicationType', publication.publicationType || publication.type || 'articles')
    formData.append('journal', publication.journal || '')
    formData.append('citations', publication.citations || 0)
    formData.append('source', 'crossref')
    formData.append('visibility', 'private')

    try {
      setMessage('')
      setImportingDoi(publication.doi)
      await makeAuthenticatedRequest(
        `${url}/api/user/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          data: formData,
        },
        navigate
      )
      setMessage(t('Imported as a draft. Review it before submission.'))
      onImportSuccess?.()
    } catch (error) {
      console.error('Crossref import failed:', error)
      setMessage(
        error.response?.status === 409
          ? t('This publication already exists in the system.')
          : t('Could not import the selected publication.')
      )
    } finally {
      setImportingDoi(null)
    }
  }

  return (
    <div className="p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Import className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-950">{t('Crossref import')}</h2>
          <p className="text-sm text-slate-500">{t('Search by author, title or DOI and save a result as a draft.')}</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('Author, title or DOI')}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
        >
          {isLoading ? t('Searching...') : t('Search')}
        </button>
      </form>

      {message && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          {message}
        </div>
      )}

      {currentItems.length > 0 && (
        <div className="mt-5 space-y-3">
          {currentItems.map((publication) => (
            <div
              key={publication.doi || publication.title}
              role="button"
              tabIndex={0}
              onClick={() => handlePublicationClick(publication.doi)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  handlePublicationClick(publication.doi)
                }
              }}
              className="block w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="line-clamp-2 text-sm font-bold leading-6 text-slate-950">
                    {publication.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{publication.authors}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {publication.journal || t('Unknown source')} {publication.year ? `(${publication.year})` : ''}
                  </p>
                  {publication.doi && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                      <ExternalLink className="h-3.5 w-3.5" />
                      {publication.doi}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(event) => handleImportDraft(publication, event)}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {importingDoi === publication.doi ? t('Importing...') : t('Import draft')}
                </button>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    currentPage === page
                      ? 'bg-blue-700 text-white'
                      : 'border border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
