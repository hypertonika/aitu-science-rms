import { jwtDecode } from 'jwt-decode'

export function getUserIIN() {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.error('Токен отсутствует. Пожалуйста, авторизуйтесь.')
      return null
    }

    const decodedToken = jwtDecode(token)
    if (!decodedToken.iin) {
      console.error('IIN не найден в токене.')
      return null
    }

    return decodedToken.iin
  } catch (error) {
    console.error('Ошибка получения IIN:', error.message)
    return null
  }
}
