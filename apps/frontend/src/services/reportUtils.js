import { makeAuthenticatedRequest } from './api'

export async function generateReport(url, navigate, options = 'all') {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('Please sign in before generating a report.')
      navigate('/login')
      return
    }

    const reportOptions = typeof options === 'string'
      ? { higherSchool: options }
      : options

    const response = await makeAuthenticatedRequest(
      `${url}/api/admin/generateAllPublicationsReport`,
      {
        method: 'POST',
        responseType: 'blob',
        data: {
          higherSchool: 'all',
          ...reportOptions,
        },
      },
      navigate
    )

    if (response.data instanceof Blob) {
      downloadBlob(
        response.data,
        'all_publications_report.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
      return
    }

    throw new Error('Invalid binary response from server')
  } catch (error) {
    console.error('Report generation failed:', error)
    alert(`Could not generate report: ${error.response?.data?.message || error.message}`)
  }
}

export async function generateUserReport(url, navigate, iin) {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      alert('Please sign in before generating a report.')
      navigate('/login')
      return
    }

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

    if (response.data instanceof Blob) {
      downloadBlob(
        response.data,
        `user_report_${iin}.docx`,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
      return
    }

    throw new Error('Invalid binary response from server')
  } catch (error) {
    console.error('User report generation failed:', error)
    alert(`Could not generate report: ${error.response?.data?.message || error.message}`)
  }
}

function downloadBlob(data, filename, type) {
  const blob = new Blob([data], { type })
  const reportUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = reportUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  window.URL.revokeObjectURL(reportUrl)
  anchor.remove()
}
