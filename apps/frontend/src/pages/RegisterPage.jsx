import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { makeAuthenticatedRequest } from '../services/api'

const RegisterPage = () => {
  const [iin, setIIN] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()
  const url = import.meta.env.VITE_API_URL

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert('Пароли не совпадают')
      return
    }

    try {
      const response = await fetch(`${url}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ iin, password }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Регистрация прошла успешно! Пожалуйста, войдите в систему.')
        navigate('/login')
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error)
      alert('Произошла ошибка. Попробуйте позже.')
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white border border-blue-300 rounded-lg p-8 w-[800px]">
        <h2 className="text-2xl font-bold text-center mb-6">Регистрация</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">ИИН</label>
            <input
              type="text"
              value={iin}
              onChange={(e) => setIIN(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Подтвердите пароль</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Зарегистрироваться
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage