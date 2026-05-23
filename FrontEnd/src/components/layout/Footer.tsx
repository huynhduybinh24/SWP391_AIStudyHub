import { useToast } from '@/components/ui/Toast'

export function Footer() {
  const toast = useToast()

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, label: string) => {
    e.preventDefault()
    toast.success(`${label} clicked`)
  }

  return (
    <footer className="flex h-14 shrink-0 items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 text-sm text-slate-500 dark:text-slate-400 select-none">
      <p>© 2024 AI Study Hub. Empowering Deep Learning.</p>
      <nav className="flex gap-4">
        <a
          href="#"
          onClick={(e) => handleLinkClick(e, 'Privacy Policy')}
          className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-200 no-underline text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          Privacy Policy
        </a>
        <a
          href="#"
          onClick={(e) => handleLinkClick(e, 'Terms of Service')}
          className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-200 no-underline text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          Terms of Service
        </a>
        <a
          href="#"
          onClick={(e) => handleLinkClick(e, 'Help Center')}
          className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-200 no-underline text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          Help Center
        </a>
      </nav>
    </footer>
  )
}
