import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import Navbar from '../components/Navbar'
import PublicationStats from '../components/PublicationStats/PublicationStats'
import BarChart from '../components/PublicationStats/BarChart'

const publicationTypeMap = {
  scopus_wos: 'Научные труды (Scopus/Web of Science)',
  koknvo: 'КОКСНВО',
  conference: 'Материалы конференций',
  articles: 'Статьи РК и не включенные в Scopus/WoS',
  books: 'Монографии, книги и учебные материалы',
  patents: 'Патенты, авторское свидетельство',
}

export default function AdminHome() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [statistics, setStatistics] = useState(null)
  const url = import.meta.env.VITE_API_URL

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')
        if (!accessToken) {
          navigate('/login')
          return
        }

        const decodedToken = jwtDecode(accessToken)
        if (decodedToken.role !== 'admin') {
          navigate('/home-user')
          return
        }

        // Fetch statistics from the backend
        const response = await fetch(`${url}/api/admin/statistics`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch statistics')
        }

        const data = await response.json()
        setStatistics(data)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching statistics:', error)
        navigate('/login')
      }
    }

    fetchStatistics()
  }, [navigate])

  if (isLoading) {
    return <p>Загрузка...</p>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar role="admin" />
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Добро пожаловать!</h1>
          <p className="text-lg text-gray-600">Ваша роль в системе - <span className="font-semibold text-indigo-600">администратор</span>.</p>
          <p className="text-gray-500 mt-2">Вы можете управлять всеми публикациями, резюме и просматривать информацию обо всех сотрудниках.</p>
        </div>

        {/* Statistics Section */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* General Stats Card */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Общая статистика</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Всего публикаций</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.totalPublications}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Всего пользователей</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.totalUsers}</p>
                </div>
              </div>
            </div>

            {/* Forecast Stats Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg shadow-md p-6 border border-yellow-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Статистика и прогноз публикаций</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Всего публикаций за 2020-2025</p>
                  <p className="text-2xl font-bold text-yellow-600">841</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Прогнозируемое количество публикаций на 2026 год</p>
                  <p className="text-2xl font-bold text-yellow-600">213</p>
                </div>
              </div>
            </div>

            {/* Schools Stats Card */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg shadow-md p-6 border border-purple-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Публикации по высшим школам</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(statistics.schools).map(([school, count]) => (
                  <div key={school} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{school === "Высшая школа информационных технологий и инженерии" ? "ВШИТиИ" : 
                           school === "Школа права" ? "ШП" : school}</span>
                    <span className="text-lg font-semibold text-purple-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Publication Types Stats Card */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-md p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Типы публикаций</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(statistics.publicationTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{publicationTypeMap[type] ? publicationTypeMap[type] : 'Неизвестный тип'}</span>
                    <span className="text-lg font-semibold text-green-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Schools Chart */}
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg shadow-md p-6 border border-indigo-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 13v-1m4 1v-3m4 3V8M12 21l9-9-9-9-9 9 9 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Статистика по школам</h2>
            </div>
            <div className="w-full max-w-4xl mx-auto">
              {statistics?.schools && 
                <BarChart 
                  labels={Object.keys(statistics.schools).map(school => 
                    school === "Высшая школа информационных технологий и инженерии" ? "ВШИТиИ" :
                    school === "Школа права" ? "ШП" : school
                  )} 
                  series={Object.keys(statistics.schools).map(k => statistics.schools[k])}
                  height={300}
                  width="100%"
                />
              }
            </div>
          </div>

          {/* Publication Types Chart */}
          <div className="bg-gradient-to-br from-cyan-50 to-white rounded-lg shadow-md p-6 border border-cyan-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Статистика публикаций</h2>
            </div>
            <div className="w-full">
              <PublicationStats />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
