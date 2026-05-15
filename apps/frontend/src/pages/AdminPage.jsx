import { createElement, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search, ShieldCheck, UserRound, Users } from 'lucide-react'
import { makeAuthenticatedRequest } from '../services/api'
import Navbar from '../components/Navbar'

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function AdminPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await makeAuthenticatedRequest(
          `${url}/api/admin/users`,
          { method: 'GET' },
          navigate
        )

        if (response?.data?.success) {
          setUsers(response.data.users)
        } else {
          setMessage('Could not load user data.')
        }
      } catch (error) {
        console.error('Users loading failed:', error)
        setMessage('Could not load users.')
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [navigate])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = searchTerm.toLowerCase()
      const matchesSearch =
        user.iin?.toLowerCase().includes(query) ||
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      const matchesRole = selectedRole === 'all' || user.role === selectedRole
      return matchesSearch && matchesRole
    })
  }, [searchTerm, selectedRole, users])

  const adminCount = users.filter((user) => user.role === 'admin').length
  const researcherCount = users.length - adminCount

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="admin" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <Users className="h-4 w-4" />
                User directory
              </div>
              <h1 className="text-3xl font-bold text-slate-950">Users</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Find researchers, open profiles and review their publication history.
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Total users" value={users.length} icon={Users} tone="blue" />
          <SummaryCard label="Researchers" value={researcherCount} icon={UserRound} tone="emerald" />
          <SummaryCard label="Admins" value={adminCount} icon={ShieldCheck} tone="amber" />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by IIN, name or email"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All roles</option>
              <option value="admin">Admins</option>
              <option value="user">Researchers</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHead>IIN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Profile</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredUsers.map((user) => (
                    <tr key={user.iin} className="transition hover:bg-slate-50">
                      <TableCell>{user.iin}</TableCell>
                      <TableCell>{user.fullName || 'Not specified'}</TableCell>
                      <TableCell>{user.email || 'Not specified'}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          user.role === 'admin'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Researcher'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/admin/user/${user.iin}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                        >
                          Open
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              <Users className="mb-4 h-10 w-10 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-950">No users found</h2>
              <p className="mt-2 text-sm text-slate-500">Adjust search or role filters.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function SummaryCard({ label, value, icon, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
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

function TableHead({ children }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  )
}

function TableCell({ children }) {
  return (
    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
      {children}
    </td>
  )
}
