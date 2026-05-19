export function Footer() {
  return (
    <footer className="flex h-14 shrink-0 items-center justify-between border-t border-border/50 bg-white px-8 text-base text-body/80">
      <p>© 2024 AI Study Hub. Empowering Deep Learning.</p>
      <nav className="flex gap-4 text-body/70">
        <a href="#" className="hover:text-primary">
          Privacy Policy
        </a>
        <a href="#" className="hover:text-primary">
          Terms of Service
        </a>
        <a href="#" className="hover:text-primary">
          Help Center
        </a>
      </nav>
    </footer>
  )
}
