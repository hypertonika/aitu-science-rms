import { Languages } from 'lucide-react'
import { useLanguage } from '../i18n'

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1" aria-label={t('language')}>
      <Languages className="ml-2 h-4 w-4 text-slate-500" />
      {['en', 'ru'].map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLanguage(item)}
          className={`rounded-md px-2 py-1 text-xs font-bold uppercase transition ${
            language === item ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}
