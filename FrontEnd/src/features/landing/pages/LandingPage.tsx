import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, MessageSquare, Cloud, Search, Share2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AppFooter } from '@/components/shared/AppFooter'

export function LandingPage() {
  const [activeSection, setActiveSection] = useState('home')
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const element = document.getElementById(id)
      if (element) {
        setTimeout(() => {
          const offset = id === 'introduction' ? 0 : element.offsetTop - 85
          window.scrollTo({ top: offset, behavior: 'smooth' })
          setActiveSection(id === 'introduction' ? 'home' : id)
        }, 100)
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setActiveSection('home')
    }
  }, [location.hash])

  useEffect(() => {
    // Custom scroll spy using IntersectionObserver
    const sections = ['features', 'about']
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -60% 0px', // Detect section when it occupies the middle/top third of the screen
      threshold: 0,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }, observerOptions)

    // Observe features and about sections
    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    // Specialized handler to detect if we scrolled to the very top (Home)
    const handleScroll = () => {
      if (window.scrollY < 100) {
        setActiveSection('home')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])



  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link 
            to="/#introduction"
            className="flex items-center gap-3.5 cursor-pointer"
          >
            <img src="/logo.png" alt="LumiEdu Logo" className="w-[68px] h-[68px] object-contain" />
            <h1 className="text-2xl font-bold text-primary tracking-tight">LumiEdu</h1>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/#introduction"
              className={`font-bold text-base bg-transparent border-t-0 border-x-0 border-b-2 border-solid transition-all duration-300 pb-1 cursor-pointer ${
                activeSection === 'home' 
                  ? 'text-primary border-primary' 
                  : 'text-slate-500 border-transparent hover:text-primary-dark'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/#features"
              className={`font-bold text-base bg-transparent border-t-0 border-x-0 border-b-2 border-solid transition-all duration-300 pb-1 cursor-pointer ${
                activeSection === 'features' 
                  ? 'text-primary border-primary' 
                  : 'text-slate-500 border-transparent hover:text-primary-dark'
              }`}
            >
              Features
            </Link>
            <Link 
              to="/#about"
              className={`font-bold text-base bg-transparent border-t-0 border-x-0 border-b-2 border-solid transition-all duration-300 pb-1 cursor-pointer ${
                activeSection === 'about' 
                  ? 'text-primary border-primary' 
                  : 'text-slate-500 border-transparent hover:text-primary-dark'
              }`}
            >
              About
            </Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
              Login
            </Link>
            <Link to="/register">
              <Button className="h-10 px-6 font-semibold rounded-full">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="introduction" className="w-full pt-20 pb-16 px-6 text-center max-w-[800px] mx-auto">
        <h2 className="text-5xl md:text-[54px] leading-[1.15] font-heading font-bold text-[#0B1C30] mb-6">
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
          <Link 
            to="/#features"
            className="h-12 px-8 flex items-center justify-center text-base font-semibold text-[#0B57D0] bg-white border border-[#0B57D0] rounded-full hover:bg-blue-50 transition-colors"
          >
            Explore Features
          </Link>
        </div>
      </section>

      {/* Main Content - Split Layout */}
      <section id="features" className="w-full max-w-[1280px] mx-auto px-6 py-12 pb-24 flex flex-col lg:flex-row gap-12">
        
        {/* Left Side: Brand Logo Banner */}
        <div className="w-full lg:w-1/2 flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-[500px] aspect-square rounded-3xl overflow-hidden shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <img 
              src="/studyhub-logo-banner.jpg" 
              alt="The StudyHub Brand Logo" 
              className="w-full h-full object-cover select-none"
            />
          </div>
        </div>

        {/* Right Side: Features Grid */}
        <div className="w-full lg:w-1/2 flex flex-col pt-4">
          <h3 className="text-[28px] font-heading font-bold text-[#0B1C30] mb-8">
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
          <h3 className="text-3xl font-heading font-bold text-[#0B1C30] mb-6">
            About LumiEdu
          </h3>
          <p className="text-lg text-[#434655] leading-relaxed mb-6">
            We are dedicated to transforming how university students interact with their course materials. 
            By leveraging advanced Artificial Intelligence, we provide a unified platform that not only stores 
            your files securely but understands them.
          </p>
          <p className="text-lg text-[#434655] leading-relaxed">
            Our mission is to help you study smarter, not harder. Whether it's summarizing a 50-page thesis 
            or finding that one specific concept buried in your lecture slides, LumiEdu is your ultimate academic companion.
          </p>
        </div>
      </section>

      {/* Footer */}
      <AppFooter />
    </div>
  )
}
