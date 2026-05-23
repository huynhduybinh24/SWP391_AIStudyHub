import { Link } from 'react-router-dom'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { Sparkles } from 'lucide-react'
import heroImg from '@/assets/hero.png'

export function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Hero Section */}
        <div className="hidden lg:flex flex-col justify-center w-[45%] bg-[#080B1A] relative px-16 py-12">
          {/* Background Layer */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
             {/* We use a dark overlay over the heroImg to simulate the design */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080B1A] z-10" />
            <img 
              src={heroImg} 
              alt="Background Concept" 
              className="w-full h-full object-cover opacity-20 mix-blend-screen" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          <div className="relative z-20 flex flex-col h-full justify-center max-w-[480px]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm w-fit mb-8">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white tracking-wider uppercase">AI STUDY HUB</span>
            </div>

            <h2 className="text-[44px] leading-[1.1] font-bold text-white mb-6">
              Elevate your<br/>academic<br/>performance.
            </h2>
            
            <p className="text-[#9BA1B0] text-[17px] leading-[1.6] mb-16">
              Join thousands of students utilizing focused intelligence to organize, analyze, and master their coursework with modern efficiency.
            </p>

            {/* Carousel Indicators */}
            <div className="flex gap-3 mt-auto pt-12">
              <div className="h-1.5 w-12 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full w-full bg-white rounded-full"></div>
              </div>
              <div className="h-1.5 w-12 bg-white/20 rounded-full"></div>
              <div className="h-1.5 w-12 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Right Pane - Form Section */}
        <div className="flex flex-col items-center justify-center w-full lg:w-[55%] p-6 bg-white overflow-y-auto">
          <RegisterForm />
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#F8FAFC] border-t border-border/50 py-6 px-8 flex flex-col md:flex-row items-center justify-between text-[13px] text-body">
        <p>© 2026 AI Study Hub Team. All rights reserved.</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0 font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/" className="hover:text-primary transition-colors">Features</Link>
          <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
          <Link to="/register" className="hover:text-primary transition-colors text-primary">Register</Link>
          <Link to="/help" className="hover:text-primary transition-colors">Help Center</Link>
        </div>
      </footer>
    </div>
  )
}
