import { Link } from 'react-router-dom'
import { BrainCog } from 'lucide-react'
import { LoginForm } from '@/features/auth/components/LoginForm'
import heroImg from '@/assets/hero.png'

export function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface font-sans">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Hero Section */}
        <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-[#F6F9FC] p-12 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <img 
              src={heroImg} 
              alt="AI Brain Concept" 
              className="w-[140%] h-[140%] object-contain opacity-[0.08] mix-blend-multiply" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center max-w-[420px] mt-12">
            <div className="flex items-center justify-center w-[56px] h-[56px] bg-white rounded-2xl shadow-sm mb-5">
              <BrainCog className="w-[28px] h-[28px] text-primary" strokeWidth={2} />
            </div>
            <h2 className="text-[32px] leading-tight font-bold text-[#0B1C30] mb-4">
              Focused Intelligence
            </h2>
            <p className="text-[#434655] text-[16px] leading-relaxed font-medium">
              Your premium workspace for deep academic work.<br/>
              Organize, synthesize, and master your coursework<br/>
              with AI-driven clarity.
            </p>
          </div>
        </div>

        {/* Right Pane - Form Section */}
        <div className="flex items-center justify-center w-full lg:w-1/2 p-6 bg-[#FAFBFC]">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#F3F5F8] border-t border-border/50 py-6 px-8 flex flex-col md:flex-row items-center justify-between text-sm text-body">
        <p>© 2024 AI Study Hub. All rights reserved.</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0 font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/" className="hover:text-primary transition-colors">Features</Link>
          <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
          <Link to="/register" className="hover:text-primary transition-colors">Register</Link>
          <Link to="/" className="hover:text-primary transition-colors">Help Center</Link>
        </div>
      </footer>
    </div>
  )
}
