import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  FileText,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import PublicationStats from '../components/PublicationStats/PublicationStats'
import { makeAuthenticatedRequest } from '../services/api'

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const quickActions = [
  {
    title: 'Manage publications',
    description: 'Add records, import metadata by DOI, submit drafts for review.',
    href: '/publications',
    icon: BookOpen,
  },
  {
    title: 'Update resume',
    description: 'Keep academic profile data ready for reports and reviews.',
    href: '/resume',
    icon: FileText,
  },
  {
    title: 'Profile settings',
    description: 'Maintain contacts, identifiers, school and visibility.',
    href: '/dashboard',
    icon: UserRound,
  },
]

export default function UserHome() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ years: {}, types: {} })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await makeAuthenticatedRequest(
          `${url}/api/user/stats`,
          { method: 'GET' },
          navigate
        )

        if (response?.status === 200) {
          setStats(response.data)
        }
      } catch (error) {
        console.error('User dashboard stats failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [navigate])

  const totalPublications = useMemo(
    () => Object.values(stats.types || {}).reduce((sum, count) => sum + count, 0),
    [stats.types]
  )

  const activeYears = useMemo(() => Object.keys(stats.years || {}).length, [stats.years])
  const publicationTypes = useMemo(() => Object.keys(stats.types || {}).length, [stats.types])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="user" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <Sparkles className="h-4 w-4" />
                Research workspace
              </div>
              <h1 className="max-w-3xl text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
                Keep your publication record clean, reviewed and ready for reporting.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Add publications manually or by DOI, track review status, manage visibility and export verified records when you need them.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/publications"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                >
                  <Plus className="h-4 w-4" />
                  Add publication
                </Link>
                <Link
                  to="/resume"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Open resume
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <p className="text-sm font-medium text-cyan-200">Current profile</p>
                  <p className="mt-2 text-2xl font-bold">Publication readiness</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Approved records are used in analytics, reports and public/institutional visibility.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MetricTile label="Approved" value={isLoading ? '...' : totalPublications} />
                  <MetricTile label="Years" value={isLoading ? '...' : activeYears} />
                  <MetricTile label="Types" value={isLoading ? '...' : publicationTypes} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700">
                <action.icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-950">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-950">Recommended workflow</h2>
                <p className="text-sm text-slate-500">A simple path from draft to approved record.</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <WorkflowStep number="01" text="Create a draft or import metadata from Crossref by DOI." />
              <WorkflowStep number="02" text="Attach evidence files and set visibility before submission." />
              <WorkflowStep number="03" text="Submit for admin review and track status on the publications page." />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-950">Your analytics</h2>
                <p className="text-sm text-slate-500">Approved publications by type and year.</p>
              </div>
            </div>
            <PublicationStats compact />
          </div>
        </section>
      </main>
    </div>
  )
}

function MetricTile({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-300">{label}</p>
    </div>
  )
}

function WorkflowStep({ number, text }) {
  return (
    <div className="flex gap-3 rounded-lg bg-slate-50 p-3">
      <span className="font-bold text-blue-700">{number}</span>
      <p className="leading-6">{text}</p>
    </div>
  )
}
