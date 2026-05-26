import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'

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
        <a
          href="#"
          onClick={(e) => handleLinkClick(e, 'Privacy Policy')}
          className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-200 no-underline text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          {t.footer.privacyPolicy}
        </a>
        <a
          href="#"
          onClick={(e) => handleLinkClick(e, 'Terms of Service')}
          className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-200 no-underline text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          {t.footer.termsOfService}
        </a>
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
