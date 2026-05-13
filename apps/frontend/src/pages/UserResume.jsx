import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { makeAuthenticatedRequest } from '../services/api'
import Navbar from '../components/Navbar'

export default function UserResume() {
  const navigate = useNavigate()
  const { iin } = useParams()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const url = import.meta.env.VITE_API_URL

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
    } else {
      const fetchUserData = async () => {
        try {
          const endpoint = `${url}/api/user/profile`
          const response = await makeAuthenticatedRequest(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }, navigate)
      
          if (response.ok) {
            const data = await response.json()
            setUser(data)
          } else {
            navigate('/login')
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error)
          navigate('/login')
        } finally {
          setIsLoading(false)
        }
      }
      fetchUserData()
    }
  }, [navigate, iin])

  const generateResume = async (format) => {
    try {
      const response = await makeAuthenticatedRequest(`${url}/api/user/generateResume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iin }),
      }, navigate)
      
      const data = await response.json()
      if (format === 'docx') {
        window.open(`${url}/api/user/downloadResumeDocx?path=${data.docxPath}`)
      } else if (format === 'pdf') {
        window.open(`${url}/api/user/downloadResumePdf?path=${data.pdfPath}`)
      }
    } catch (error) {
      console.error('Error generating resume:', error)
    }
  }

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (!user) {
    return <p>User not found</p>
  }

  return (
    <>
      <Navbar role="user" />
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-4">Резюме пользователя: {user.fullName}</h1>
        <div className="mb-6">
          <p><strong>ИИН:</strong> {user.iin}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Телефон:</strong> {user.phone}</p>
          <p><strong>Научные интересы:</strong> {user.researchArea}</p>
        </div>

        <div className="mt-4">
          <button
            onClick={() => generateResume('docx')}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg mr-4 hover:bg-blue-700"
          >
            Скачать DOCX
          </button>
          <button
            onClick={() => generateResume('pdf')}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
          >
            Скачать PDF
          </button>
        </div>
      </div>
    </>
  )
}
