import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, FileText, Mail, Phone, UserRound } from 'lucide-react'
import { makeAuthenticatedRequest } from '../services/api'
import Navbar from '../components/Navbar'

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function UserResume() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await makeAuthenticatedRequest(`${url}/api/user/profile`, { method: 'GET' }, navigate)

        if (response?.status === 200) {
          setUser(response.data)
        }
      } catch (error) {
        console.error('Resume profile loading failed:', error)
        setMessage('Could not load resume data.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [navigate])

  const generateResume = async (format) => {
    try {
      setMessage('')
      const response = await makeAuthenticatedRequest(
        `${url}/api/user/generateResume`,
        {
          method: 'POST',
          data: { iin: user?.iin },
        },
        navigate
      )

      const data = response.data
      if (format === 'docx') {
        window.open(`${url}/api/user/downloadResumeDocx?path=${encodeURIComponent(data.docxPath)}`)
      } else if (format === 'pdf') {
        window.open(`${url}/api/user/downloadResumePdf?path=${encodeURIComponent(data.pdfPath)}`)
      }
    } catch (error) {
      console.error('Resume generation failed:', error)
      setMessage('Could not generate resume file.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar role="user" />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar role="user" />
        <main className="mx-auto flex min-h-96 w-full max-w-7xl items-center justify-center px-4 py-6">
          <p className="text-sm font-medium text-slate-500">{message || 'User not found.'}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="user" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <FileText className="h-4 w-4" />
                Resume builder
              </div>
              <h1 className="text-3xl font-bold text-slate-950">Academic Resume</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Generate a DOCX or PDF resume from your profile and publication data.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => generateResume('docx')} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800">
                <Download className="h-4 w-4" />
                DOCX
              </button>
              <button type="button" onClick={() => generateResume('pdf')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
                <Download className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-950">{user.fullName || 'Unnamed researcher'}</h2>
                <p className="text-sm text-slate-500">IIN {user.iin}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={Phone} label="Phone" value={user.phone} />
              <InfoRow label="Higher school" value={user.higherSchool} />
              <InfoRow label="Research area" value={user.researchArea} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-950">Resume readiness</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The generated file uses your saved profile fields and approved publication data. For a stronger final resume, fill in email, phone, higher school, research area and author identifiers in your profile.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ReadinessItem label="Contact details" done={Boolean(user.email && user.phone)} />
              <ReadinessItem label="Academic identifiers" done={Boolean(user.orcid || user.scopusId || user.wosId)} />
              <ReadinessItem label="Research area" done={Boolean(user.researchArea)} />
              <ReadinessItem label="Higher school" done={Boolean(user.higherSchool)} />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="whitespace-pre-wrap font-medium leading-6 text-slate-800">{value || 'Not specified'}</p>
    </div>
  )
}

function ReadinessItem({ label, done }) {
  return (
    <div className={`rounded-lg border p-3 text-sm font-semibold ${
      done
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-amber-200 bg-amber-50 text-amber-700'
    }`}>
      {label}: {done ? 'Ready' : 'Missing'}
    </div>
  )
}
