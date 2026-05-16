import { jwtDecode } from 'jwt-decode'

export function getUserIdentifier() {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return null
    }

    const decodedToken = jwtDecode(token)
    return decodedToken.iin || decodedToken.email || null
  } catch (error) {
    console.error('Could not read user identifier:', error.message)
    return null
  }
}
