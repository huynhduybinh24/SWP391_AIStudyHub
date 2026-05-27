import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { Sparkles, ArrowLeft } from 'lucide-react'
import heroImg from '@/assets/hero.png'
import { AppFooter } from '@/components/shared/AppFooter'
import { Link } from 'react-router-dom'

export function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative">
      {/* Return to Landing Button */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm cursor-pointer select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại trang chủ</span>
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Hero Section */}
        <div className="hidden lg:flex flex-col justify-center w-[45%] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative px-16 py-12 border-r border-slate-200/50 dark:border-slate-800/50">
          {/* Background Layer */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
             {/* We use a gradient overlay over the heroImg to simulate the design */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950 z-10" />
            <img 
              src={heroImg} 
              alt="Background Concept" 
              className="w-full h-full object-cover opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          <div className="relative z-20 flex flex-col h-full justify-center max-w-[480px]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-fit mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase">LUMIEDU</span>
            </div>

            <h2 className="text-[44px] leading-[1.1] font-bold text-slate-900 dark:text-white mb-6">
              Elevate your<br/>academic<br/>performance.
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 text-[17px] leading-[1.6] mb-16 font-medium">
              Join thousands of students utilizing focused intelligence to organize, analyze, and master their coursework with modern efficiency.
            </p>

            {/* Carousel Indicators */}
            <div className="flex gap-3 mt-auto pt-12">
              <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-full bg-blue-600 dark:bg-blue-400 rounded-full"></div>
              </div>
              <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Right Pane - Form Section */}
        <div className="flex flex-col items-center justify-center w-full lg:w-[55%] p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
          <RegisterForm />
        </div>
      </div>

      <AppFooter variant="simple" />
    </div>
  )
}
