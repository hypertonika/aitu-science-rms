import { makeAuthenticatedRequest } from './api'
import { useNavigate } from 'react-router-dom'

export async function generateReport(url, navigate, selectedSchool = 'all') {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('Авторизуйтесь перед генерацией отчета.')
      navigate('/login')
      return
    }

    const response = await makeAuthenticatedRequest(
      `${url}/api/admin/generateAllPublicationsReport`,
      {
        method: 'POST',
        responseType: 'blob',
        data: { higherSchool: selectedSchool },
      },
      navigate
    )

    // Проверяем, что получили бинарные данные
    if (response.data instanceof Blob) {
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const reportUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = reportUrl
      a.download = 'all_publications_report.docx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(reportUrl)
      a.remove()
    } else {
      throw new Error('Неверный формат ответа от сервера')
    }
  } catch (error) {
    console.error('Ошибка при генерации отчета:', error)
    alert('Произошла ошибка при генерации отчета: ' + (error.response?.data?.message || error.message))
  }
}

export async function generateUserReport(url, navigate, iin) {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('Авторизуйтесь перед генерацией отчета.')
      navigate('/login')
      return
    }

    // Генерируем отчет
    const response = await makeAuthenticatedRequest(
      `${url}/api/admin/generateUserReport`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'blob',
        data: { iin },
      },
      navigate
    )

    // Проверяем, что получили бинарные данные
    if (response.data instanceof Blob) {
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const reportUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = reportUrl
      a.download = `user_report_${iin}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(reportUrl)
      a.remove()
    } else {
      throw new Error('Неверный формат ответа от сервера')
    }
  } catch (error) {
    console.error('Ошибка при генерации отчета:', error)
    alert('Произошла ошибка при генерации отчета: ' + (error.response?.data?.message || error.message))
  }
}
