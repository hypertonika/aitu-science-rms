/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'

const translations = {
  en: {
    dashboard: 'Dashboard',
    publications: 'Publications',
    researchers: 'Researchers',
    home: 'Home',
    profile: 'Profile',
    signOut: 'Sign out',
    adminWorkspace: 'Admin workspace',
    researcherWorkspace: 'Researcher workspace',
    signIn: 'Sign in',
    createAccount: 'Create account',
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    confirmPassword: 'Confirm password',
    newResearcher: 'New researcher?',
    alreadyRegistered: 'Already registered?',
    homeTitle: 'Research records in one calm workspace.',
    homeSubtitle: 'Maintain researcher profiles, submit publications for review, and prepare reports without scattered spreadsheets.',
    dailyWork: 'For daily university work',
    researchersText: 'Add publication records, import DOI metadata, track review status.',
    adminsText: 'Review submissions, leave comments, approve verified records.',
    reportsText: 'Export publication data and generate academic resume files.',
    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    savePassword: 'Save password',
    language: 'Language',
  },
  ru: {
    dashboard: 'Панель',
    publications: 'Публикации',
    researchers: 'Исследователи',
    home: 'Главная',
    profile: 'Профиль',
    signOut: 'Выйти',
    adminWorkspace: 'Панель администратора',
    researcherWorkspace: 'Кабинет исследователя',
    signIn: 'Войти',
    createAccount: 'Создать аккаунт',
    email: 'Почта',
    password: 'Пароль',
    fullName: 'ФИО',
    confirmPassword: 'Повторите пароль',
    newResearcher: 'Новый исследователь?',
    alreadyRegistered: 'Уже зарегистрированы?',
    homeTitle: 'Спокойное рабочее пространство для научных публикаций.',
    homeSubtitle: 'Ведите профили исследователей, отправляйте публикации на проверку и готовьте отчеты без разрозненных таблиц.',
    dailyWork: 'Для ежедневной работы университета',
    researchersText: 'Добавление публикаций, импорт DOI-метаданных и отслеживание статуса проверки.',
    adminsText: 'Проверка заявок, комментарии и утверждение подтвержденных записей.',
    reportsText: 'Экспорт публикаций и генерация академических резюме.',
    changePassword: 'Смена пароля',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    savePassword: 'Сохранить пароль',
    language: 'Язык',
  },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')

  const value = useMemo(() => ({
    language,
    setLanguage: (nextLanguage) => {
      localStorage.setItem('language', nextLanguage)
      setLanguage(nextLanguage)
    },
    t: (key) => translations[language]?.[key] || translations.en[key] || key,
  }), [language])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
