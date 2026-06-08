import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import {
  Camera,
  Eye,
  IdCard,
  Mail,
  Pencil,
  Phone,
  Save,
  UserRound,
  X,
} from 'lucide-react'
import { makeAuthenticatedRequest } from '../services/api'
import Navbar from '../components/Navbar'
import { allHigherSchools, visibilityMap } from '../constants/publications'
import { useLanguage } from '../i18n'

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const initialUserData = {
  fullName: '',
  profilePhoto: '',
  scopusId: '',
  wosId: '',
  orcid: '',
  birthDate: '',
  phone: '',
  email: '',
  researchArea: '',
  higherSchool: '',
  profileVisibility: 'institutional',
  role: '',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { iin } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [message, setMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [userData, setUserData] = useState(initialUserData)
  const { t } = useLanguage()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      navigate('/login')
      return
    }

    const decodedToken = jwtDecode(token)
    const admin = decodedToken.role === 'admin'
    setIsAdmin(admin)

    const fetchUserData = async () => {
      try {
        const endpoint = admin && iin ? `${url}/api/admin/user/${iin}` : `${url}/api/user/profile`
        const response = await makeAuthenticatedRequest(endpoint, { method: 'GET' }, navigate)

        if (response?.status === 200) {
          setUserData(response.data.user || response.data)
        }
      } catch (error) {
        console.error('Profile loading failed:', error)
        setMessage(t('Could not load profile data.'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [navigate, iin, t])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setUserData((current) => ({ ...current, [name]: value }))
  }

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('profilePhoto', file)

    try {
      setMessage('')
      const response = await makeAuthenticatedRequest(
        `${url}/api/user/uploadPhoto`,
        {
          method: 'POST',
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        },
        navigate
      )

      if (response?.status === 200) {
        setUserData((current) => ({ ...current, profilePhoto: response.data.profilePhoto }))
        setMessage(t('Profile photo updated.'))
      }
    } catch (error) {
      console.error('Photo upload failed:', error)
      setMessage(t('Could not upload profile photo. Use an image up to 5 MB.'))
    }
  }

  const handleSave = async () => {
    try {
      setMessage('')
      const updateData = {
        fullName: userData.fullName,
        scopusId: userData.scopusId,
        wosId: userData.wosId,
        orcid: userData.orcid,
        birthDate: userData.birthDate,
        phone: userData.phone,
        email: userData.email,
        researchArea: userData.researchArea,
        higherSchool: userData.higherSchool,
        profileVisibility: userData.profileVisibility,
      }

      const response = await makeAuthenticatedRequest(
        `${url}/api/user/update`,
        {
          method: 'PUT',
          data: updateData,
        },
        navigate
      )

      if (response?.status === 200) {
        setUserData((current) => ({ ...current, ...(response.data.user || updateData) }))
        setIsEditing(false)
        setMessage(t('Profile saved.'))
      }
    } catch (error) {
      console.error('Profile update failed:', error)
      setMessage(error.response?.data?.message || t('Could not save profile changes.'))
    }
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    setPasswordMessage('')

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage(t('New password must contain at least 8 characters.'))
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage(t('New passwords do not match.'))
      return
    }

    try {
      const response = await makeAuthenticatedRequest(
        `${url}/api/user/changePassword`,
        {
          method: 'PUT',
          data: {
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          },
        },
        navigate
      )

      if (response?.status === 200) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        localStorage.removeItem('refreshToken')
        setPasswordMessage(t('Password changed. Please sign in again after your next logout.'))
      }
    } catch (error) {
      console.error('Password change failed:', error)
      setPasswordMessage(error.response?.data?.message || t('Could not change password.'))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar role={isAdmin ? 'admin' : 'user'} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role={isAdmin ? 'admin' : 'user'} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
            <aside className="border-b border-slate-200 bg-slate-950 p-6 text-white lg:border-b-0 lg:border-r">
              <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border-4 border-white/20 bg-white/10">
                <img
                  src={userData.profilePhoto ? `${url}${userData.profilePhoto}` : '/default-profile.png'}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-5 text-center">
                <h1 className="text-xl font-bold">{userData.fullName || t('Your profile')}</h1>
                <p className="mt-1 text-sm text-slate-300">{userData.email || t('Email not specified')}</p>
                <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
                  {userData.role === 'admin' ? t('Admin') : t('Researcher')}
                </span>
              </div>

              {isEditing && !isAdmin && (
                <label className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                  <Camera className="h-4 w-4" />
                  {t('Upload photo')}
                  <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" />
                </label>
              )}
            </aside>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                    <UserRound className="h-4 w-4" />
                    {t('Academic profile')}
                  </div>
                  <h2 className="text-3xl font-bold text-slate-950">{t('Profile Details')}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {t('Keep identifiers, contacts and research interests accurate for reports and publication records.')}
                  </p>
                </div>

                {!isAdmin && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing((value) => !value)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    >
                      {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                      {isEditing ? t('Cancel') : t('Edit')}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                      >
                        <Save className="h-4 w-4" />
                        {t('Save')}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {message && (
                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  {message}
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field name="fullName" label={t('Full name')} value={userData.fullName} icon={IdCard} isEditing={isEditing && !isAdmin} onChange={handleInputChange} />
                <Field name="email" label={t('Email')} value={userData.email} icon={Mail} isEditing={isEditing && !isAdmin} onChange={handleInputChange} />
                <Field name="phone" label={t('Phone')} value={userData.phone} icon={Phone} isEditing={isEditing && !isAdmin} onChange={handleInputChange} />
                <Field name="birthDate" label={t('Birth date')} value={userData.birthDate} type="date" isEditing={isEditing && !isAdmin} onChange={handleInputChange} />
                <Field name="orcid" label="ORCID" value={userData.orcid} isEditing={isEditing && !isAdmin} onChange={handleInputChange} />
                <Field name="scopusId" label={t('Scopus Author ID')} value={userData.scopusId} isEditing={isEditing && !isAdmin} onChange={handleInputChange} />
                <Field name="wosId" label={t('Web of Science ID')} value={userData.wosId} isEditing={isEditing && !isAdmin} onChange={handleInputChange} />
                <SelectField
                  name="profileVisibility"
                  label={t('Profile visibility')}
                  value={userData.profileVisibility || 'institutional'}
                  icon={Eye}
                  isEditing={isEditing && !isAdmin}
                  onChange={handleInputChange}
                  options={Object.entries(visibilityMap).map(([value, label]) => ({ value, label: t(label) }))}
                />
                <SelectField
                  name="higherSchool"
                  label={t('Higher school')}
                  value={userData.higherSchool || ''}
                  isEditing={isEditing && !isAdmin}
                  onChange={handleInputChange}
                  options={allHigherSchools.map((school) => ({ value: school, label: t(school) }))}
                  wide
                />
                <Field name="researchArea" label={t('Research area')} value={userData.researchArea} isEditing={isEditing && !isAdmin} onChange={handleInputChange} multiline wide />
              </div>
            </div>
          </div>
        </section>

        {!isAdmin && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-950">{t('changePassword')}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {t('Use a strong password. After changing it, old refresh sessions are invalidated.')}
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="grid gap-4 md:grid-cols-3">
              <PasswordInput
                label={t('currentPassword')}
                value={passwordForm.currentPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
              />
              <PasswordInput
                label={t('newPassword')}
                value={passwordForm.newPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
              />
              <PasswordInput
                label={t('confirmPassword')}
                value={passwordForm.confirmPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
              />
              <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {t('savePassword')}
                </button>
                {passwordMessage && <p className="text-sm font-medium text-slate-600">{passwordMessage}</p>}
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}

function PasswordInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

function Field({ name, label, value, icon: Icon, isEditing, onChange, type = 'text', multiline = false, wide = false }) {
  const { t } = useLanguage()

  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-4 ${wide ? 'md:col-span-2' : ''}`}>
      <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </label>
      {isEditing ? (
        multiline ? (
          <textarea name={name} value={value || ''} onChange={onChange} rows={4} className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        ) : (
          <input type={type} name={name} value={value || ''} onChange={onChange} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        )
      ) : (
        <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">{value || t('Not specified')}</p>
      )}
    </div>
  )
}

function SelectField({ name, label, value, icon: Icon, isEditing, onChange, options, wide = false }) {
  const { t } = useLanguage()
  const selected = options.find((option) => option.value === value)

  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-4 ${wide ? 'md:col-span-2' : ''}`}>
      <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </label>
      {isEditing ? (
        <select name={name} value={value} onChange={onChange} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
          <option value="">{t('Not specified')}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">{selected?.label || value || t('Not specified')}</p>
      )}
    </div>
  )
}
