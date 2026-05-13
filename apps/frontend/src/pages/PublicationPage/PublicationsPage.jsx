import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { makeAuthenticatedRequest } from '../../services/api'
import { generateUserReport } from '../../services/reportUtils'
import { getUserIIN } from '../../services/userUtils'
import Navbar from '../../components/Navbar'
import ErrorMessage from '../../components/ErrorMessage'
import ADD from './BREAD/ADD'
import EDIT from './BREAD/EDIT'
import PublicationComponents from '../../components/FilterComponents/PublicationComponents'
import Pagination from '../../components/Pagination/Pagination'
import CrossrefImport from '../../components/PublicationImport/CrossrefImport'


export const publicationTypeMap = {
  scopus_wos: 'Научные труды (Scopus/Web of Science)',
  koknvo: 'КОКСНВО',
  conference: 'Материалы конференций',
  articles: 'Статьи РК и не включенные в Scopus/WoS',
  books: 'Монографии, книги и учебные материалы',
  patents: 'Патенты, авторское свидетельство',
}

export const statusMap = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const visibilityMap = {
  private: 'Private',
  institutional: 'Institutional',
  public: 'Public',
}

export default function PublicationsPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [publications, setPublications] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [type, setType] = useState(null);
  const [year, setYear] = useState(null);
  const [school, setSchool] = useState(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("")
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [showImport, setShowImport] = useState(false);

  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  useEffect(() => {
    try {
      const iin = getUserIIN()
      console.log('IIN пользователя:', iin)
  
      localStorage.setItem('iin', iin)
  
      const token = localStorage.getItem('accessToken')

      if (!token) {
        console.warn("Токен отсутствует, редирект на /login")
        navigate('/login')
        return
      } else
      {
        console.log('token')
      }

      const decodedToken = jwtDecode(token)
      // setIsAdmin(decodedToken.role === 'admin')

      const isAdmin = decodedToken.role === 'admin' ? true : false;
      console.log("isAdmin:", isAdmin)
  
      setIsAdmin(isAdmin)

    } catch (error) {
      console.error('Ошибка при получении IIN:', error.message)
      setErrorMessage("Вы не авторизованы. Пожалуйста, войдите в систему.")
      navigate('/login')
    }
  }, [navigate])
  const fetchPublications = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
      if (!token) return
  
      const iin = localStorage.getItem('iin')
  
      try {
        const response = await makeAuthenticatedRequest(
          `${url}/api/user/getPublications`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
              params: { iin, publicationType: type, school, year, status: status || undefined, query: search || undefined }

          },
          navigate
        )
        console.log("Ответ от сервера:", response)


        if (response.status === 200) {  
          console.log("Публикации успешно загружены!")
          setPublications(response.data)  // Здесь данные из Axios
        } else {
          console.warn("Не удалось загрузить публикации, редирект...")
          setErrorMessage("Не удалось загрузить публикации.")
          navigate('/login')
        }
      } catch (error) {
        console.error('Ошибка при загрузке публикаций:', error)
        setErrorMessage("Произошла ошибка при загрузке публикаций.")
      } finally {
        setIsLoading(false)
      }
  }, [navigate, school, type, url, year, status, search])

  useEffect(() => {
    if (isAdmin === null) return;
      fetchPublications()
  }, [isAdmin, fetchPublications])



  const handleGenerateUserReport = () => {
    try {
      const iin = getUserIIN()
      generateUserReport(url, navigate, iin)
    } catch (error) {
      console.error('Ошибка при генерации отчета:', error.message)
      setErrorMessage("Произошла ошибка при генерации отчета.")
    }
  }

  

  const handleDeletePublication= async (id) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        alert('Ошибка авторизации. Пожалуйста, войдите снова.')
        return
      }
      
      const response = await makeAuthenticatedRequest(`${url}/api/admin/publications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }, navigate)

      if (response.status!==200) {
        const errorText = await response.text()
        throw new Error(`Ошибка при delete: ${errorText}`)
      }
      fetchPublications()
      alert('Публикация успешно DELETED!')
      navigate('/publications')
    } catch (error) {
      console.error('Ошибка при delete изменений:', error)
      alert('Произошла ошибка. Попробуйте позже.')
    }
  }

  const handleSubmitPublication = async (id) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await makeAuthenticatedRequest(`${url}/api/user/upload/${id}/submit`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }, navigate)

      if (response.status === 200) {
        fetchPublications()
      }
    } catch (error) {
      console.error('Submit failed:', error)
      setErrorMessage('Не удалось отправить публикацию на проверку.')
    }
  }

  const handleExport = async (format) => {
    try {
      const response = await makeAuthenticatedRequest(`${url}/api/user/publications/export`, {
        method: 'GET',
        responseType: 'blob',
        params: { format },
      }, navigate)
      const blob = new Blob([response.data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' })
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
      setErrorMessage('Не удалось экспортировать публикации.')
    }
  }

  const paginatedPublications = publications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(publications.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Функция сброса страницы на первую
  const resetPage = () => setCurrentPage(1);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-lg font-bold text-gray-700">Загрузка...</p>
      </div>
    )
  }

  return (
    <>
      <Navbar role={isAdmin ? 'admin' : 'user'} />
      <div className="w-full mx-auto min-h-screen bg-white p-4 md:p-8">
        <ErrorMessage message={errorMessage} />

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center md:text-left">
            Публикации
          </h1>
          <div className="flex flex-col sm:flex-row justify-center md:justify-end items-center gap-3">
            <button
              onClick={() => setShowImport(!showImport)}
              className="w-full sm:w-auto py-2 px-4 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            >
              {showImport ? 'Скрыть импорт' : 'Импорт из Crossref'}
            </button>
            {!isAdmin && (
              <>
                <ADD updateData={fetchPublications} />
                <button
                  onClick={handleGenerateUserReport}
                  className="w-full sm:w-auto py-2 px-4 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                >
                  Генерировать отчет
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full sm:w-auto py-2 px-4 text-sm text-white bg-slate-600 hover:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition duration-200"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full sm:w-auto py-2 px-4 text-sm text-white bg-slate-600 hover:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition duration-200"
                >
                  PDF
                </button>
              </>
            )}
          </div>
        </div>

        {showImport && (
          <div className="mb-8">
            <CrossrefImport onImportSuccess={fetchPublications} />
          </div>
        )}

        <PublicationComponents setYear={setYear} setSchool={setSchool} setType={setType} school={school} type={type}/>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={search}
            onChange={(event) => { setSearch(event.target.value); resetPage(); }}
            placeholder="Search title, author, DOI"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value); resetPage(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {Object.entries(statusMap).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="mt-6">
          {paginatedPublications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedPublications.map((publication, index) => (
                <div key={index} className="flex flex-col justify-between border border-gray-300 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden min-h-[300px]">
                  <div className="p-4">
                    <div className="mb-3 pb-2 border-b border-gray-300">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-indigo-500 rounded-full mb-1">
                        {publicationTypeMap[publication.publicationType]}
                      </span>
                      <span className="inline-block ml-2 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full mb-1">
                        {statusMap[publication.status] || publication.status || 'Draft'}
                      </span>
                      <h3 className="text-base font-semibold line-clamp-2 mb-1 text-gray-800 text-left" title={publication.title}>
                        {publication.title}
                      </h3>
                      <p className="text-xs text-gray-600 text-left">
                        Год: {publication.year}
                      </p>
                    </div>
                    
                    <div className="text-xs text-gray-700 text-left">
                      <p className="mb-2 line-clamp-2 flex" title={`Авторы: ${publication.authors}`}>
                        <span className="font-medium text-gray-800 min-w-[80px]">Авторы:</span> 
                        <span>{publication.authors}</span>
                      </p>
                      <p className="mb-2 line-clamp-2 flex" title={`Выходные данные: ${publication.output}`}>
                        <span className="font-medium text-gray-800 min-w-[80px]">Данные:</span> 
                        <span>{publication.output}</span>
                      </p>
                      {publication.doi && (
                        <p className="mb-2 line-clamp-1 flex" title={`DOI: ${publication.doi}`}>
                          <span className="font-medium text-gray-800 min-w-[80px]">DOI:</span> 
                          <span>{publication.doi}</span>
                        </p>
                      )}
                      {publication.isbn && (
                        <p className="mb-2 line-clamp-1 flex" title={`ISBN: ${publication.isbn}`}>
                          <span className="font-medium text-gray-800 min-w-[80px]">ISBN:</span> 
                          <span>{publication.isbn}</span>
                        </p>
                      )}
                      {publication.file && (
                        <p className="mb-2 flex">
                          <span className="font-medium text-gray-800 min-w-[80px]">Файл:</span>
                          <a href={`${url}/${publication.file}`} download className="text-blue-500 hover:text-blue-600 hover:underline flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Скачать файл
                          </a>
                        </p>
                      )}
                      <p className="mb-2 line-clamp-1 flex">
                        <span className="font-medium text-gray-800 min-w-[80px]">Visibility:</span>
                        <span>{visibilityMap[publication.visibility] || publication.visibility || 'Private'}</span>
                      </p>
                      {publication.reviewComment && (
                        <p className="mb-2 line-clamp-2 flex" title={publication.reviewComment}>
                          <span className="font-medium text-gray-800 min-w-[80px]">Review:</span>
                          <span>{publication.reviewComment}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-50 p-2 mt-auto border-t border-gray-300">
                    {publication.status !== 'approved' && (
                      <EDIT pub={publication} updateData={fetchPublications} resetPage={resetPage}/>
                    )}
                    {['draft', 'rejected'].includes(publication.status || 'draft') && (
                      <button
                        onClick={() => handleSubmitPublication(publication._id)}
                        className="py-1 px-2 text-xs text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
                      >
                        Submit
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePublication(publication._id)}
                      className="py-1 px-2 text-xs text-white bg-rose-500 rounded-lg hover:bg-rose-600"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center min-h-[50vh] w-full">
              <p className="text-gray-600 text-lg">У вас пока нет публикаций.</p>
            </div>
          )}
        </div>

        {publications.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </>
  )
}
