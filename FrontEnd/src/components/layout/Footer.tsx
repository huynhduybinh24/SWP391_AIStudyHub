import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { Link } from 'react-router-dom'

export function Footer() {
  const toast = useToast()
  const { t } = useTranslation()

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, _label: string) => {
    e.preventDefault()
    toast.success(`${t.common.loading}`)
  }

  return (
    <footer className="flex h-14 shrink-0 items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 text-sm text-slate-500 dark:text-slate-400 select-none">
      <p>{t.footer.copyright}</p>
      <nav className="flex gap-4">
        <Link
          to="/privacy-policy"
          className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-200 no-underline text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          {t.footer.privacyPolicy}
        </Link>
        <Link
          to="/terms-of-service"
          className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-200 no-underline text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          {t.footer.termsOfService}
        </Link>
        <a
          href="#"
          onClick={(e) => handleLinkClick(e, 'Help Center')}
          className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-200 no-underline text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          {t.footer.helpCenter}
        </a>
      </nav>
    </footer>
  )
}
