import { Link } from 'react-router-dom'
import { useTranslation } from '@/context/LanguageContext'

export function AppFooter() {
  const { t } = useTranslation()

  return (
    <footer className="w-full border-t bg-white text-slate-500 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 select-none">
      <div className="mx-auto flex max-w-[1800px] flex-col items-center justify-between gap-4 px-8 py-8 text-center md:flex-row md:text-left">
        <p className="text-sm font-medium">
          {t.footer.copyright}
        </p>
        <nav className="flex items-center gap-6">
          <Link
            to="/help"
            className="text-sm font-semibold transition-colors duration-200 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {t.footer.supportCenter}
          </Link>
          <Link
            to="/contact"
            className="text-sm font-semibold transition-colors duration-200 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {t.footer.partnershipContact}
          </Link>
        </nav>
      </div>
    </footer>
  )
}

export default AppFooter
