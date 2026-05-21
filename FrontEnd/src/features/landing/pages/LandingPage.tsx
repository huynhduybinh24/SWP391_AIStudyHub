import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MessageSquare, Cloud, Search, Share2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function LandingPage() {
  const [activeSection, setActiveSection] = useState('home')

  const scrollToHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setActiveSection('home')
  }

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
    setActiveSection('features')
  }

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
    setActiveSection('about')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={scrollToHome}
          >
            <img src="/logo.png" alt="AI Study Hub Logo" className="h-8 w-auto object-contain" />
            <h1 className="text-2xl font-bold text-primary tracking-tight">AI Study Hub</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={scrollToHome} className={`font-semibold transition-colors ${activeSection === 'home' ? 'text-primary border-b-2 border-primary pb-1' : 'text-body hover:text-foreground'}`}>Home</button>
            <button onClick={scrollToFeatures} className={`font-semibold transition-colors ${activeSection === 'features' ? 'text-primary border-b-2 border-primary pb-1' : 'text-body hover:text-foreground'}`}>Features</button>
            <button onClick={scrollToAbout} className={`font-semibold transition-colors ${activeSection === 'about' ? 'text-primary border-b-2 border-primary pb-1' : 'text-body hover:text-foreground'}`}>About</button>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
              Login
            </Link>
            <Link to="/login">
              <Button className="h-10 px-6 font-semibold rounded-full">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full pt-20 pb-16 px-6 text-center max-w-[800px] mx-auto">
        <h2 className="text-5xl md:text-[54px] leading-[1.15] font-serif font-bold text-[#0B1C30] mb-6">
          Revolutionize Your Study Game with AI.
        </h2>
        <p className="text-lg md:text-xl text-[#434655] mb-10 leading-relaxed max-w-[680px] mx-auto">
          The all-in-one platform for university students to manage documents, chat with AI, and store files securely in the cloud. Focus on learning, let intelligence handle the rest.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login">
            <Button className="h-12 px-8 text-base font-semibold rounded-full flex items-center gap-2 bg-[#0B57D0] hover:bg-[#0842A0]">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <button 
            onClick={scrollToFeatures}
            className="h-12 px-8 text-base font-semibold text-[#0B57D0] bg-white border border-[#0B57D0] rounded-full hover:bg-blue-50 transition-colors"
          >
            Explore Features
          </button>
        </div>
      </section>

      {/* Main Content - Split Layout */}
      <section id="features" className="w-full max-w-[1280px] mx-auto px-6 py-12 pb-24 flex flex-col lg:flex-row gap-12">
        
        {/* Left Side: Mockup Image */}
        <div className="w-full lg:w-1/2 flex items-center justify-center min-h-[400px]">
          {/* iMac Mockup Wrapper */}
          <div className="w-full max-w-[600px] relative">
            <div className="w-full aspect-[16/10] bg-slate-900 rounded-2xl border-[12px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col">
              {/* Fake dashboard content inside the screen */}
              <div className="flex-1 bg-[#1E293B] flex items-center justify-center p-8 relative">
                {/* Decorative UI elements representing the AI dashboard */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #38BDF8 0%, transparent 70%)' }}></div>
                <div className="relative z-10 text-center">
                  <div className="w-32 h-32 rounded-full border-4 border-[#38BDF8] mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(56,189,248,0.5)]">
                    <span className="text-4xl font-bold text-[#38BDF8]">AI</span>
                  </div>
                  <div className="flex flex-col gap-3 items-center">
                    <div className="h-4 w-48 bg-slate-700 rounded-full"></div>
                    <div className="h-3 w-64 bg-slate-700/50 rounded-full"></div>
                    <div className="flex gap-4 mt-4 w-full px-8">
                       <div className="h-16 flex-1 bg-slate-700/30 rounded-lg"></div>
                       <div className="h-16 flex-1 bg-slate-700/30 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* iMac Stand */}
            <div className="w-1/4 h-16 bg-gradient-to-b from-slate-400 to-slate-300 mx-auto rounded-b-lg shadow-inner relative z-0" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}></div>
            <div className="w-1/3 h-2 bg-slate-300 mx-auto rounded-full shadow-md mt-[-2px]"></div>
          </div>
        </div>

        {/* Right Side: Features Grid */}
        <div className="w-full lg:w-1/2 flex flex-col pt-4">
          <h3 className="text-[28px] font-serif font-bold text-[#0B1C30] mb-8">
            Supercharge Your Workflow
          </h3>
          
          <div className="flex flex-col gap-6">
            {/* Feature 1 - Full Width */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/60 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-sm">
                <MessageSquare className="w-6 h-6" fill="currentColor" />
              </div>
              <h4 className="text-xl font-semibold text-[#0B1C30] mb-3">Contextual AI Chatbot</h4>
              <p className="text-[#434655] leading-relaxed text-sm">
                Instantly interrogate your course materials. Upload lectures, readings, or notes, and ask our AI complex questions to get immediate, cited answers based solely on your documents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Feature 2 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/60 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-4 text-white shadow-sm">
                  <Cloud className="w-6 h-6" fill="currentColor" />
                </div>
                <h4 className="text-base font-semibold text-[#0B1C30] mb-2">Cloud Storage</h4>
                <p className="text-[#434655] leading-relaxed text-sm">
                  Secure, unlimited storage for all your academic files, synced perfectly across all your devices.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/60 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-sm">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-[#0B1C30] mb-2">Smart Search</h4>
                <p className="text-[#434655] leading-relaxed text-sm">
                  Find exact concepts across hundreds of PDFs in milliseconds with our semantic search engine.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/60 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                  <Share2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-[#0B1C30] mb-2">File Sharing</h4>
                <p className="text-[#434655] leading-relaxed text-sm">
                  Collaborate seamlessly. Create shared vaults for group projects and study groups with granular permissions.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-indigo-50/50 p-6 rounded-2xl shadow-sm border border-indigo-100 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-[#0B1C30] mb-2">Automated AI Summaries</h4>
                <p className="text-[#434655] leading-relaxed text-sm">
                  Transform 50-page research papers into digestible, key-point summaries in seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="w-full bg-white py-20 px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <h3 className="text-3xl font-serif font-bold text-[#0B1C30] mb-6">
            About AI Study Hub
          </h3>
          <p className="text-lg text-[#434655] leading-relaxed mb-6">
            We are dedicated to transforming how university students interact with their course materials. 
            By leveraging advanced Artificial Intelligence, we provide a unified platform that not only stores 
            your files securely but understands them.
          </p>
          <p className="text-lg text-[#434655] leading-relaxed">
            Our mission is to help you study smarter, not harder. Whether it's summarizing a 50-page thesis 
            or finding that one specific concept buried in your lecture slides, AI Study Hub is your ultimate academic companion.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#F3F5F8] border-t border-border/50 py-8 px-6 mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-[#434655]">
          <p>© 2024 AI Study Hub. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0 font-medium">
            <a href="#" className="hover:text-primary transition-colors">Home</a>
            <a href="#" className="hover:text-primary transition-colors">Features</a>
            <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
            <Link to="/login" className="hover:text-primary transition-colors">Register</Link>
            <a href="#" className="hover:text-primary transition-colors">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
