import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

const LoginPage = () => {
  const navigate = useNavigate()
  const [iin, setIIN] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('') 

  const url = import.meta.env.VITE_API_URL

  const handleIINChange = (e) => {
    const input = e.target.value.toLowerCase()
    const isNumeric = /^\d*$/.test(input) 
    const isAllowedText = /^[admin]*$/.test(input)

    if ((isNumeric && input.length <= 12) || isAllowedText) {
      setIIN(input)
      setError('')
    } else {
      setError('Логин должен состоять из цифр (12 символов).')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const isNumeric = /^\d{12}$/.test(iin)
    const isAdmin = iin === 'admin'

    if (!isNumeric && !isAdmin) {
      setError('Логин должен быть ровно 12 цифр')
      return
    }
    
    try {
      const response = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ iin, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Ошибка: ${errorData.message || 'Невозможно выполнить запрос'}`)
      }

      const data = await response.json()

      if (data.accessToken && data.refreshToken) {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)

        const decodedToken = jwtDecode(data.accessToken)
        const userRole = decodedToken.role

        navigate(userRole === 'admin' ? '/home-admin' : '/home-user')
      } else {
        throw new Error('Токены не были получены')
      }
    } catch (error) {
      console.error('Error during login:', error.message)
      alert(error.message || 'Произошла ошибка. Попробуйте позже.')
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white border border-blue-300 rounded-lg p-8 w-[800px]">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Вход в систему</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Логин</label>
            <input
              type="text"
              value={iin}
              onChange={handleIINChange}
              required
              className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Войти
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-blue-400">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-blue-500 hover:underline">
            Зарегистрируйтесь здесь
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
