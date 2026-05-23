import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="flex h-14 shrink-0 items-center justify-between border-t border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 px-8 text-xs font-semibold text-slate-500 select-none">
      <p>© 2026 AI Study Hub Team. All rights reserved.</p>
      <nav className="flex gap-6">
        <Link
          to="/help"
          className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-200 no-underline text-slate-500 cursor-pointer"
        >
          Privacy Policy
        </Link>
        <Link
          to="/help"
          className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-200 no-underline text-slate-500 cursor-pointer"
        >
          Terms of Service
        </Link>
        <Link
          to="/help"
          className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-200 no-underline text-slate-500 cursor-pointer"
        >
          Help Center
        </Link>
      </nav>
    </footer>
  )
}
