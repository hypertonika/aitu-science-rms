import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const url = import.meta.env.VITE_API_URL

if (!url) {
  console.error('VITE_API_URL не задан в окружении')
}

export async function refreshAccessToken(navigate) {
  const refreshToken = localStorage.getItem('refreshToken')

  if (!refreshToken) {
    console.error('Отсутствует Refresh Token')
    return null
  }

  try {
    const response = await axios.post(`${url}/api/auth/refresh-token`, { refreshToken })

    if (response.status === 200) {
      localStorage.setItem('accessToken', response.data.accessToken)
      return response.data.accessToken
    } else {
      throw new Error('Ошибка при обновлении токена')
    }
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error)
    if (navigate) {
      navigate('/login')
    } else {
      window.location.href = '/login'
    }
  }
}

export async function makeAuthenticatedRequest(endpoint, options = {}, navigate, retry = true) {
  let accessToken = localStorage.getItem('accessToken')

  if (!accessToken) {
    console.error("No access token found in localStorage")
    return null
  }

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  }

  try {
    const response = await axios(endpoint, options)

    if (response.status === 401 && retry) {
      console.warn("Unauthorized. Attempting token refresh...")
      accessToken = await refreshAccessToken(navigate)
      if (accessToken) {
        options.headers.Authorization = `Bearer ${accessToken}`
        return makeAuthenticatedRequest(endpoint, options, navigate, false)
      } else {
        console.error("Token refresh failed. Redirecting to login.")
        return null
      }
    }

    return response
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error.message)
    throw error
  }
}
