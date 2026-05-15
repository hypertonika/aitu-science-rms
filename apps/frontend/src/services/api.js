import axios from 'axios'

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function refreshAccessToken(navigate) {
  const refreshToken = localStorage.getItem('refreshToken')

  if (!refreshToken) {
    return null
  }

  try {
    const response = await axios.post(`${url}/api/auth/refresh-token`, { refreshToken })

    localStorage.setItem('accessToken', response.data.accessToken)
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken)
    }

    return response.data.accessToken
  } catch (error) {
    console.error('Token refresh failed:', error.message)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')

    if (navigate) {
      navigate('/login')
    } else {
      window.location.href = '/login'
    }

    return null
  }
}

export async function makeAuthenticatedRequest(endpoint, options = {}, navigate, retry = true) {
  let accessToken = localStorage.getItem('accessToken')

  if (!accessToken) {
    accessToken = await refreshAccessToken(navigate)
    if (!accessToken) {
      return null
    }
  }

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  }

  try {
    return await axios(endpoint, options)
  } catch (error) {
    if (error.response?.status === 401 && retry) {
      const nextAccessToken = await refreshAccessToken(navigate)

      if (nextAccessToken) {
        options.headers.Authorization = `Bearer ${nextAccessToken}`
        return makeAuthenticatedRequest(endpoint, options, navigate, false)
      }

      return null
    }

    throw error
  }
}
