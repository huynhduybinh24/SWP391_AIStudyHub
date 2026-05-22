export function Footer() {
  return (
    <footer className="flex h-14 shrink-0 items-center justify-between border-t border-border/50 dark:border-slate-850 bg-white dark:bg-slate-950 px-8 text-sm text-slate-550 dark:text-slate-450 select-none">
      <p>© 2024 AI Study Hub. Empowering Deep Learning.</p>
      <nav className="flex gap-4">
        <a href="#" className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-250 no-underline text-slate-550 dark:text-slate-450 cursor-pointer">
          Privacy Policy
        </a>
        <a href="#" className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-250 no-underline text-slate-550 dark:text-slate-450 cursor-pointer">
          Terms of Service
        </a>
        <a href="#" className="hover:text-[#3155F6] dark:hover:text-blue-400 hover:underline transition-colors duration-250 no-underline text-slate-550 dark:text-slate-450 cursor-pointer">
          Help Center
        </a>
      </nav>
    </footer>
  )
}
