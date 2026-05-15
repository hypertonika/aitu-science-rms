import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { refreshAccessToken } from '../services/api'

function getTokenRole(token) {
  try {
    return jwtDecode(token).role
  } catch {
    return null
  }
}

export default function ProtectedRoute({ children, roles = [] }) {
  const navigate = useNavigate()
  const [role, setRole] = useState(() => getTokenRole(localStorage.getItem('accessToken')))
  const [isChecking, setIsChecking] = useState(!role)

  useEffect(() => {
    if (role) return

    let isMounted = true

    async function checkSession() {
      const token = await refreshAccessToken(navigate)
      if (!isMounted) return

      setRole(getTokenRole(token))
      setIsChecking(false)
    }

    checkSession()

    return () => {
      isMounted = false
    }
  }, [navigate, role])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        Loading...
      </div>
    )
  }

  if (!role) {
    return <Navigate to="/login" replace />
  }

  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/home-admin' : '/home-user'} replace />
  }

  return children
}
