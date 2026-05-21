import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, FileText, MessageSquare } from 'lucide-react'

export function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      <header className="w-full bg-white border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="AI Study Hub Logo" className="h-8 w-auto object-contain" />
            <h1 className="text-2xl font-bold text-primary tracking-tight">AI Study Hub</h1>
          </Link>
          <Link to="/" className="text-sm font-semibold text-[#434655] hover:text-primary transition-colors flex items-center gap-2">
             <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1000px] mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#0B1C30] mb-4">How can we help you?</h2>
          <p className="text-lg text-[#434655] max-w-2xl mx-auto">
            Find answers, guides, and support for using AI Study Hub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-border/60 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-[#0B1C30] mb-3">Getting Started</h3>
            <p className="text-[#434655] text-sm mb-6">Learn the basics of uploading documents and generating summaries.</p>
            <button className="text-primary font-semibold hover:underline text-sm">Read Guides &rarr;</button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-border/60 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-[#0B1C30] mb-3">FAQs</h3>
            <p className="text-[#434655] text-sm mb-6">Find quick answers to the most commonly asked questions.</p>
            <button className="text-primary font-semibold hover:underline text-sm">View FAQs &rarr;</button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-border/60 text-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-600">
              <Mail className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-[#0B1C30] mb-3">Contact Support</h3>
            <p className="text-[#434655] text-sm mb-6">Need more help? Our support team is here to assist you.</p>
            <a href="mailto:support@aistudyhub.com" className="text-primary font-semibold hover:underline text-sm">Email Us &rarr;</a>
          </div>
        </div>
      </main>

      <footer className="w-full bg-white border-t border-border/50 py-8 px-6 mt-auto text-center">
        <p className="text-sm text-[#434655]">© 2024 AI Study Hub. All rights reserved.</p>
      </footer>
    </div>
  )
}
