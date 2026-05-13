import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import Navbar from '../components/Navbar'
import PublicationStats from '../components/PublicationStats/PublicationStats'

export default function UserHome() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')

    if (!accessToken) {
      navigate('/login')
      setIsLoading(false)
      return
    }

    try {
      const decodedToken = jwtDecode(accessToken)
      if (decodedToken.role !== 'user') {
        navigate('/home-admin')
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Invalid token:', error)
      navigate('/login')
      setIsLoading(false)
    }
  }, [navigate])

  if (isLoading) {
    return <p>Загрузка...</p>
  }

  return (
    <div>
      <Navbar role="user" />
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-2xl font-bold">Добро пожаловать на главную страницу!</h1>
        <p className="mt-4">Вы можете управлять своими публикациями и резюме через навигацию сверху.</p>
      </div>
      <PublicationStats/>
    </div>
  )
}
