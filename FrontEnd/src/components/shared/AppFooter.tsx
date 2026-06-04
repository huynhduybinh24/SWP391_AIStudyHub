import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from '@/context/LanguageContext'
import { Mail, GraduationCap } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { DEV_SKIP_AUTH } from '@/config/dev'
import { POST_LOGIN_REDIRECT_KEY } from '@/features/auth/hooks/useLogin'
import { ContactAdminModal } from '@/components/layout/ContactAdminModal'

// Custom stroke-based brand SVGs for Lucide v1 compatibility
function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function Facebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function Linkedin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

interface AppFooterProps {
  variant?: 'full' | 'simple'
}

export function AppFooter({ variant = 'full' }: AppFooterProps) {
  const { t, language } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const isUserAdmin = user?.role?.toLowerCase() === 'admin'
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  // In DEV_SKIP_AUTH mode, treat as unauthenticated so footer links still redirect to login correctly
  const isReallyAuthenticated = DEV_SKIP_AUTH ? false : isAuthenticated
  const navigate = useNavigate()

  const [isContactOpen, setIsContactOpen] = useState(false)

  // Simplified variant: standard sleek light/dark footer bar
  if (variant === 'simple') {
    return (
      <>
        <footer className="w-full border-t bg-white text-slate-500 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 select-none">
          <div className="mx-auto flex max-w-[1800px] flex-col items-center justify-between gap-4 px-8 py-6 text-center md:flex-row md:text-left">
            <p className="text-sm font-medium">
              {t.footer.copyright}
            </p>
            <nav className="flex items-center gap-6 md:pr-24">
              {isUserAdmin ? (
                <>
                  <Link
                    to="/dashboard/admin?tab=overview"
                    className="text-sm font-semibold transition-colors duration-200 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {language === 'vi' ? 'Bảng tổng quan' : 'Overview'}
                  </Link>
                  <Link
                    to="/dashboard/admin?tab=activity-logs"
                    className="text-sm font-semibold transition-colors duration-200 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                  >
                    {language === 'vi' ? 'Nhật ký hệ thống' : 'System Logs'}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/help"
                    className="text-sm font-semibold transition-colors duration-200 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {t.footer.supportCenter}
                  </Link>
                  <button
                    onClick={() => setIsContactOpen(true)}
                    className="text-sm font-semibold transition-colors duration-200 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-transparent border-none p-0 cursor-pointer"
                  >
                    {t.footer.emailAdmin}
                  </button>
                </>
              )}
            </nav>
          </div>
        </footer>
        <ContactAdminModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      </>
    )
  }

  const handleProtectedLink = (to: string) => {
    if (!isReallyAuthenticated) {
      sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, to)
      navigate('/login')
    } else {
      navigate(to)
    }
  }

  // Define localized strings based on active language (vi / en / ja / ko)
  const isVi = language === 'vi'

  const content = {
    aboutTitle: isVi ? 'Về LumiEdu' : 'About LumiEdu',
    aboutLinks: [
      { text: isVi ? 'Giới thiệu' : 'Introduction', to: '/#introduction' },
      { text: isVi ? 'Tính năng' : 'Features', to: '/#features' },
      { text: isVi ? 'Bảng giá' : 'Pricing Plans', to: '/pricing' },
      { text: t.footer.termsOfService, to: '/terms-of-service' },
      { text: t.footer.privacyPolicy, to: '/privacy-policy' },
      { text: t.footer.emailAdmin, to: '', isModal: true },
    ],
    exploreTitle: isVi ? 'Tính năng & Khám phá' : 'Features & Explore',
    exploreLinks: isUserAdmin
      ? [
          { text: isVi ? 'Bảng điều khiển Admin' : 'Admin Dashboard', to: '/dashboard/admin?tab=overview', isProtected: false },
          { text: isVi ? 'Quản lý Người dùng' : 'User Management', to: '/dashboard/admin?tab=users', isProtected: false },
          { text: isVi ? 'Kiểm duyệt Tài liệu' : 'Document Management', to: '/dashboard/admin?tab=ai-moderation', isProtected: false },
          { text: isVi ? 'Quản lý Gói cước' : 'Package Management', to: '/dashboard/admin?tab=packages', isProtected: false },
          { text: isVi ? 'Yêu cầu Hợp tác' : 'Partnership Requests', to: '/dashboard/admin?tab=partnership-requests', isProtected: false },
          { text: t.footer.helpCenter, to: '/help', isProtected: false },
        ]
      : [
          { text: isVi ? 'Tài liệu của tôi' : 'My Documents', to: '/dashboard/documents', isProtected: true },
          { text: isVi ? 'Trợ lý AI Chatbot' : 'AI Chatbot Assistant', to: '/dashboard/chat', isProtected: true },
          { text: isVi ? 'Không gian chia sẻ' : 'Shared Workspace', to: '/dashboard/shared', isProtected: true },
          { text: isVi ? 'Kế hoạch học tập' : 'Study Plans', to: '/dashboard/study-plans', isProtected: true },
          { text: isVi ? 'Dung lượng đám mây' : 'Cloud Storage', to: '/dashboard/storage', isProtected: true },
          { text: t.footer.helpCenter, to: '/help', isProtected: false },
        ],
    infoTitle: isVi ? 'NỀN TẢNG HỌC TẬP SỐ THÔNG MINH' : 'INTELLIGENT DIGITAL EDUCATION PLATFORM',
    infoItems: [
      {label: isVi ? 'Ban phát triển' : 'R&D Team', value: 'SWP391 Team 4' },
      { label: isVi ? 'Hệ sinh thái' : 'Ecosystem', value: isVi ? 'AI & Giáo dục số (EdTech)' : 'AI & Digital EdTech' },
      { label: isVi ? 'Sứ mệnh' : 'Mission', value: isVi ? 'Cá nhân hóa tri thức thế hệ mới' : 'Empowering Digital Intellect' },
      { label: isVi ? 'Mã định danh' : 'Project ID', value: 'LumiEdu_Core_v1.0' },
      { label: isVi ? 'Hạ tầng cốt lõi' : 'Tech Stack', value: 'React, TS, Tailwind, Gemini AI' },
    ],
    slogan: isVi ? 'Khơi nguồn tri thức — Kiến tạo tương lai' : 'Igniting knowledge — Shaping the future',
    copyrightText: isVi ? '© 2026 LumiEdu. Tất cả quyền được bảo lưu.' : '© 2026 LumiEdu. All rights reserved.',
  }

  return (
    <>
    <footer className="w-full bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#2563EB] text-slate-100 border-t border-blue-900/40 select-none relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-[1280px] px-6 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">
          
          {/* Column 1: About Links */}
          <div className="flex flex-col">
            <h4 className="text-white font-bold font-heading text-lg mb-6 pb-2 border-b border-white/10 uppercase tracking-wider">
              {content.aboutTitle}
            </h4>
            <ul className="flex flex-col gap-3.5">
              {content.aboutLinks.map((link, idx) => (
                <li key={idx}>
                  {link.isModal ? (
                    <button
                      onClick={() => setIsContactOpen(true)}
                      className="text-slate-200/90 hover:text-white text-[15px] font-medium transition-all duration-200 hover:translate-x-1 inline-block text-left cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                    >
                      {link.text}
                    </button>
                  ) : (
                    <Link
                      to={link.to || '/'}
                      className="text-slate-200/90 hover:text-white text-[15px] font-medium transition-all duration-200 hover:translate-x-1 inline-block"
                    >
                      {link.text}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Explore Links */}
          <div className="flex flex-col">
            <h4 className="text-white font-bold font-heading text-lg mb-6 pb-2 border-b border-white/10 uppercase tracking-wider">
              {content.exploreTitle}
            </h4>
            <ul className="flex flex-col gap-3.5">
              {content.exploreLinks.map((link, idx) => (
                <li key={idx}>
                  {link.isProtected ? (
                    <button
                      onClick={() => handleProtectedLink(link.to)}
                      className="text-slate-200/90 hover:text-white text-[15px] font-medium transition-all duration-200 hover:translate-x-1 inline-block text-left cursor-pointer bg-transparent border-none p-0"
                    >
                      {link.text}
                    </button>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-slate-200/90 hover:text-white text-[15px] font-medium transition-all duration-200 hover:translate-x-1 inline-block"
                    >
                      {link.text}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Tech Project Info */}
          <div className="flex flex-col">
            <h4 className="text-white font-bold font-heading text-lg mb-6 pb-2 border-b border-white/10 uppercase tracking-wider">
              {content.infoTitle}
            </h4>
            <div className="bg-gradient-to-br from-blue-950/70 via-indigo-950/60 to-slate-950/70 rounded-2xl p-5 border border-white/10 shadow-[0_8px_32px_0_rgba(37,99,235,0.15)] space-y-4 relative overflow-hidden group hover:border-blue-500/30 hover:shadow-[0_12px_40px_rgba(37,99,235,0.25)] hover:-translate-y-1 transition-all duration-300">
              {/* Outer decorative glowing ring */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-300" />
              
              {/* Pulse status dot in corner */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase select-none">Active</span>
              </div>

              <h5 className="font-extrabold text-white text-base tracking-wide flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-400/20 text-blue-300">
                  <GraduationCap className="w-4.5 h-4.5 text-blue-300 animate-pulse" />
                </div>
                <span className="bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent tracking-widest uppercase font-black">
                  LUMIEDU
                </span>
              </h5>
              
              <ul className="space-y-2.5 pt-1">
                {content.infoItems.map((item, idx) => {
                  const isTech = item.label.toLowerCase().includes('tech') || item.label.toLowerCase().includes('công nghệ')
                  const isProject = item.label.toLowerCase().includes('project') || item.label.toLowerCase().includes('mã số')
                  
                  return (
                    <li key={idx} className="flex justify-between items-center gap-4 py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-slate-300/80 text-[12px] font-semibold tracking-wide uppercase shrink-0">{item.label}</span>
                      {isTech ? (
                        <div className="flex flex-wrap gap-1 justify-end max-w-[190px]">
                          {item.value.split(',').map((tech, tIdx) => (
                            <span 
                              key={tIdx} 
                              className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 tracking-wide uppercase shadow-xs hover:bg-blue-500/20 transition-colors"
                            >
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      ) : isProject ? (
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900/80 border border-white/10 text-cyan-300 shadow-inner">
                          {item.value}
                        </span>
                      ) : (
                        <span className="font-bold text-right text-slate-100 text-[13px] tracking-wide">
                          {item.value}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

        </div>

        {/* Horizontal Divider */}
        <div className="w-full border-t border-white/10 my-10" />

        {/* Bottom Panel */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Slogan */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-white/10">
                <img src="/logo.png" alt="LumiEdu Logo" className="w-9 h-9 object-contain" />
              </div>
              <span className="text-xl md:text-2xl font-bold font-heading text-white tracking-tight">
                LumiEdu
              </span>
            </div>
            <p className="text-slate-300/90 text-sm italic font-medium">
              "{content.slogan}"
            </p>
          </div>

          {/* Social Links & Copyright */}
          <div className="flex flex-col items-center md:items-end gap-3.5">
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/huynhduybinh24/SWP391_AIStudyHub"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 transition-colors"
                title="GitHub Repository"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 transition-colors"
                title="Facebook Page"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 transition-colors"
                title="LinkedIn Profile"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:support@aistudyhub.com"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 transition-colors"
                title="Email Support"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <p className="text-slate-300/80 text-xs font-semibold tracking-wide">
              {content.copyrightText}
            </p>
          </div>
        </div>

      </div>
    </footer>
    <ContactAdminModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  )
}

export default AppFooter
