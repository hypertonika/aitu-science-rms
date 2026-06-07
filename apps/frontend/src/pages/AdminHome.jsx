import { createElement, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  SearchCheck,
  ShieldCheck,
  Users,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import PublicationStats from '../components/PublicationStats/PublicationStats'
import BarChart from '../components/PublicationStats/BarChart'
import { publicationTypeMap } from '../constants/publications'
import { makeAuthenticatedRequest } from '../services/api'

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const schoolShortNames = new Map([
  ['School of Intelligent Systems', 'SIS'],
  ['School of Artificial Intelligence and Data Science', 'AI & DS'],
  ['School of Software Engineering', 'SE'],
  ['School of Cybersecurity', 'Cybersecurity'],
  ['School of Creative Industries', 'Creative'],
  ['School of Digital Public Administration', 'Digital Gov'],
  ['School of General Educational Disciplines', 'General Ed'],
  ['Школа интеллектуальных систем', 'SIS'],
  ['Школа искусственного интеллекта и науки о данных', 'AI & DS'],
  ['Школа программной инженерии', 'SE'],
  ['Школа кибербезопасности', 'Cybersecurity'],
  ['Школа креативных индустрий', 'Creative'],
  ['Школа цифрового государственного управления', 'Digital Gov'],
])

const reviewSteps = [
  'Check metadata completeness, DOI, year and publication type.',
  'Verify authorship and attached evidence before approval.',
  'Use review comments when returning records for correction.',
]

export default function AdminHome() {
  const navigate = useNavigate()
  const [statistics, setStatistics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await makeAuthenticatedRequest(
          `${url}/api/admin/statistics`,
          { method: 'GET' },
          navigate
        )

        if (response?.status === 200) {
          setStatistics(response.data)
        }
      } catch (error) {
        console.error('Admin statistics failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatistics()
  }, [navigate])

  const schoolEntries = useMemo(
    () => Object.entries(statistics?.schools || {}).sort((a, b) => b[1] - a[1]),
    [statistics]
  )

  const typeEntries = useMemo(
    () => Object.entries(statistics?.publicationTypes || {}).sort((a, b) => b[1] - a[1]),
    [statistics]
  )

  const topSchool = schoolEntries[0]
  const totalPublications = statistics?.totalPublications ?? 0
  const totalUsers = statistics?.totalUsers ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="admin" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
                <LayoutDashboard className="h-4 w-4" />
                Administration center
              </div>
              <h1 className="max-w-3xl text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                Review research output, monitor schools and keep verified records publishable.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                This dashboard summarizes approved publications and gives administrators a fast path to user and publication review workflows.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin-publications"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <ClipboardCheck className="h-4 w-4" />
                Review publications
              </Link>
              <Link
                to="/admin-users"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Manage users
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FileText}
            label="Approved publications"
            value={isLoading ? '...' : totalPublications}
            tone="blue"
          />
          <StatCard
            icon={Users}
            label="Registered users"
            value={isLoading ? '...' : totalUsers}
            tone="emerald"
          />
          <StatCard
            icon={Building2}
            label="Active schools"
            value={isLoading ? '...' : schoolEntries.length}
            tone="cyan"
          />
          <StatCard
            icon={BarChart3}
            label="Publication categories"
            value={isLoading ? '...' : typeEntries.length}
            tone="amber"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <SearchCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-950">Review focus</h2>
                <p className="text-sm text-slate-500">Practical checks before approving records.</p>
              </div>
            </div>

            <div className="space-y-3">
              {reviewSteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-bold text-blue-700">{String(index + 1).padStart(2, '0')}</span>
                  <p className="leading-6">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="mb-2 flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4" />
                Current leader
              </div>
              <p>
                {topSchool
                  ? `${formatSchoolName(topSchool[0])}: ${topSchool[1]} approved publications`
                  : 'School distribution will appear after approvals.'}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-950">Publications by school</h2>
                <p className="text-sm text-slate-500">Approved records grouped by author school.</p>
              </div>
            </div>

            {schoolEntries.length > 0 ? (
              <BarChart
                labels={schoolEntries.map(([school]) => formatSchoolName(school))}
                series={schoolEntries.map(([, count]) => count)}
                height={320}
              />
            ) : (
              <EmptyState text="No approved school data yet." />
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <BarChart3 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-950">Research analytics</h2>
                <p className="text-sm text-slate-500">Approved publications by type and year.</p>
              </div>
            </div>
            <PublicationStats compact />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-950">Type distribution</h2>
                <p className="text-sm text-slate-500">A quick list for scanning category balance.</p>
              </div>
            </div>

            {typeEntries.length > 0 ? (
              <div className="space-y-3">
                {typeEntries.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">
                      {publicationTypeMap[type] || type}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-950 shadow-sm">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No approved publication types yet." />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    amber: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
        {createElement(icon, { className: 'h-5 w-5' })}
      </div>
      <p className="text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <p className="flex min-h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
      {text}
    </p>
  )
}

function formatSchoolName(school) {
  return schoolShortNames.get(school) || school
}
