import { ArrowRight, BookOpenCheck, FileSearch, ShieldCheck } from 'lucide-react'
import { createElement } from 'react'
import { Link } from 'react-router-dom'

const highlights = [
  { label: 'DOI-assisted entry', icon: FileSearch },
  { label: 'Approval workflow', icon: ShieldCheck },
  { label: 'Reports and exports', icon: BookOpenCheck },
]

const HomePage = () => {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="min-h-screen flex items-center px-4 py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <img src="/logo.png" alt="Astana IT University" className="h-12 w-12 object-contain" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">AITU Science RMS</p>
                <p className="text-sm text-slate-500">Research Management System</p>
              </div>
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
              University research records, ready for review and reporting.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              A central workspace for researcher profiles, publication metadata, DOI import,
              validation workflows, and institutional exports.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
              >
                Create researcher account
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="border-b border-slate-200 pb-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Prototype scope</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Diploma-ready MVP</h2>
            </div>

            <div className="mt-5 grid gap-3">
              {highlights.map(({ label, icon }) => (
                <div key={label} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    {createElement(icon, { className: 'h-5 w-5' })}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-300">Built for</p>
              <p className="mt-1 text-xl font-semibold">Astana IT University</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                React, Express, MongoDB, Crossref metadata import, approval records, PDF/CSV/Excel exports.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
