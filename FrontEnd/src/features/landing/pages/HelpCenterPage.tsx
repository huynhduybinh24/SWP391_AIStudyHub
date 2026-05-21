import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  FileText,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Cloud,
  Shield,
  CheckCircle,
  X,
} from 'lucide-react'

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
const faqs = [
  {
    id: 1,
    category: 'Getting Started',
    question: 'How do I create an account on AI Study Hub?',
    answer:
      'Click the "Register" button on the homepage, fill in your name, email, and password, then verify your email. Your account will be ready to use immediately after verification.',
  },
  {
    id: 2,
    category: 'Getting Started',
    question: 'What file formats does AI Study Hub support?',
    answer:
      'We support PDF, DOCX, PPTX, TXT, and image files (PNG, JPG). The AI works best with PDF and DOCX files as they preserve text formatting.',
  },
  {
    id: 3,
    category: 'AI Features',
    question: 'How does the AI Chatbot work with my documents?',
    answer:
      'Once you upload a document, our AI indexes its content. You can then open the Chat page, select your document, and ask any question. The AI will answer based solely on the content of that document and cite the exact page or section.',
  },
  {
    id: 4,
    category: 'AI Features',
    question: 'How accurate are the AI-generated summaries?',
    answer:
      'Our summaries capture the key points with high accuracy. However, we always recommend reviewing the original document for critical academic work, as AI may occasionally miss nuanced context.',
  },
  {
    id: 5,
    category: 'Storage & Files',
    question: 'How much storage do I get for free?',
    answer:
      'Free accounts include 5 GB of cloud storage. You can upgrade to a premium plan for unlimited storage and additional AI credits.',
  },
  {
    id: 6,
    category: 'Storage & Files',
    question: 'Is my data safe and private?',
    answer:
      'Yes. All files are encrypted at rest (AES-256) and in transit (TLS 1.3). We never share your documents with third parties. You can delete your data at any time from the Storage page.',
  },
  {
    id: 7,
    category: 'Account & Billing',
    question: 'How do I reset my password?',
    answer:
      'Go to the Login page and click "Forgot password?". Enter your email address, and we will send you a secure link to set a new password. The link expires after 30 minutes.',
  },
  {
    id: 8,
    category: 'Account & Billing',
    question: 'Can I cancel my subscription at any time?',
    answer:
      'Yes. You can cancel your subscription anytime from your Profile → Settings → Billing. You will retain access to premium features until the end of your current billing period.',
  },
]

const guides = [
  { icon: BookOpen, title: 'Uploading Your First Document', color: 'bg-blue-100 text-blue-600', steps: ['Click "Upload" in the sidebar', 'Select your PDF or DOCX file', 'Add tags and a subject category', 'Click "Upload" — the AI will index it automatically'] },
  { icon: MessageSquare, title: 'Chatting With the AI', color: 'bg-indigo-100 text-indigo-600', steps: ['Navigate to the "Chat" section', 'Select a document from the list', 'Type your question in the input box', 'The AI responds with cited answers from your doc'] },
  { icon: Cloud, title: 'Managing Cloud Storage', color: 'bg-teal-100 text-teal-600', steps: ['Go to "Storage" in the sidebar', 'Create folders to organise your files', 'Drag & drop to move files between folders', 'Use "Share" to collaborate with classmates'] },
  { icon: Shield, title: 'Keeping Your Account Secure', color: 'bg-purple-100 text-purple-600', steps: ['Use a strong, unique password', 'Enable two-factor authentication in Settings', 'Never share your login credentials', 'Log out on shared devices after use'] },
]

const CATEGORIES = ['All', 'Getting Started', 'AI Features', 'Storage & Files', 'Account & Billing']

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'faq' | 'guides' | 'contact'>('faq')

  // Contact form state
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const filteredFaqs = faqs.filter((f) => {
    const matchesCategory = activeCategory === 'All' || f.category === activeCategory
    const matchesSearch =
      searchQuery.trim() === '' ||
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Name is required.'
    if (!form.email.trim()) errors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email.'
    if (!form.subject.trim()) errors.subject = 'Subject is required.'
    if (!form.message.trim()) errors.message = 'Message is required.'
    return errors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setFormErrors({})
    setSubmitted(true)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* ── Header ── */}
      <header className="w-full bg-white border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="AI Study Hub Logo" className="h-8 w-auto object-contain" />
            <span className="text-2xl font-bold text-primary tracking-tight">AI Study Hub</span>
          </Link>
          <Link
            to="/"
            className="text-sm font-semibold text-[#434655] hover:text-primary transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="w-full bg-gradient-to-br from-[#0B57D0] to-[#1a73e8] py-16 px-6 text-center text-white">
        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">How can we help you?</h2>
        <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
          Search our knowledge base or browse guides and FAQs below.
        </p>
        {/* Search bar */}
        <div className="max-w-[560px] mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="help-search"
            type="text"
            placeholder="Search for answers…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setActiveTab('faq') }}
            className="w-full h-14 pl-12 pr-12 rounded-2xl text-[#0B1C30] text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </section>

      {/* ── Tabs ── */}
      <section className="w-full bg-white border-b border-border/50">
        <div className="max-w-[1000px] mx-auto px-6 flex gap-2 pt-6 pb-0">
          {(['faq', 'guides', 'contact'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-t-xl font-semibold text-sm transition-colors capitalize border border-b-0 ${
                activeTab === tab
                  ? 'bg-[#F8FAFC] text-primary border-border/60'
                  : 'bg-transparent text-[#434655] border-transparent hover:text-primary'
              }`}
            >
              {tab === 'faq' ? 'FAQs' : tab === 'guides' ? 'Guides' : 'Contact Support'}
            </button>
          ))}
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="flex-1 w-full max-w-[1000px] mx-auto px-6 py-12">

        {/* ── FAQ Tab ── */}
        {activeTab === 'faq' && (
          <div>
            {/* Category filters */}
            <div className="flex flex-wrap gap-2 mb-8">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    activeCategory === cat
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-[#434655] border-border/60 hover:border-primary hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-20 text-[#434655]">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No results found for "<span className="text-primary">{searchQuery}</span>"</p>
                <p className="text-sm mt-2">Try different keywords or browse all categories.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                  >
                    <button
                      id={`faq-toggle-${faq.id}`}
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left"
                    >
                      <div>
                        <span className="text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full mr-3">{faq.category}</span>
                        <span className="text-[#0B1C30] font-semibold">{faq.question}</span>
                      </div>
                      {openFaq === faq.id
                        ? <ChevronUp className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
                        : <ChevronDown className="w-5 h-5 text-[#434655] flex-shrink-0 ml-4" />}
                    </button>
                    {openFaq === faq.id && (
                      <div className="px-6 pb-6 text-[#434655] leading-relaxed border-t border-border/40 pt-4 text-sm">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Guides Tab ── */}
        {activeTab === 'guides' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {guides.map((guide) => (
              <div key={guide.title} className="bg-white rounded-2xl border border-border/60 shadow-sm p-7 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${guide.color} flex items-center justify-center mb-5`}>
                  <guide.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1C30] mb-4">{guide.title}</h3>
                <ol className="flex flex-col gap-3">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#434655]">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}

        {/* ── Contact Tab ── */}
        {activeTab === 'contact' && (
          <div className="max-w-[660px] mx-auto">
            {submitted ? (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-[#0B1C30] mb-3">Message Sent!</h3>
                <p className="text-[#434655] mb-8">
                  Thank you for reaching out. Our support team will get back to you within 1–2 business days.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-[#0842A0] transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0B1C30]">Contact Support</h3>
                    <p className="text-sm text-[#434655]">We typically reply within 1–2 business days.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-semibold text-[#0B1C30] mb-2">Full Name</label>
                      <input
                        id="contact-name"
                        type="text"
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.name ? 'border-red-400' : 'border-border/60'}`}
                      />
                      {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-semibold text-[#0B1C30] mb-2">Email Address</label>
                      <input
                        id="contact-email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.email ? 'border-red-400' : 'border-border/60'}`}
                      />
                      {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-semibold text-[#0B1C30] mb-2">Subject</label>
                    <select
                      id="contact-subject"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className={`w-full h-11 px-4 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.subject ? 'border-red-400' : 'border-border/60'}`}
                    >
                      <option value="">Select a topic…</option>
                      <option value="Account & Login">Account &amp; Login</option>
                      <option value="AI Features">AI Features</option>
                      <option value="Storage & Files">Storage &amp; Files</option>
                      <option value="Billing">Billing</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Other">Other</option>
                    </select>
                    {formErrors.subject && <p className="text-xs text-red-500 mt-1">{formErrors.subject}</p>}
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-semibold text-[#0B1C30] mb-2">Message</label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      placeholder="Describe your issue or question in detail…"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.message ? 'border-red-400' : 'border-border/60'}`}
                    />
                    {formErrors.message && <p className="text-xs text-red-500 mt-1">{formErrors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 bg-primary text-white font-semibold rounded-xl hover:bg-[#0842A0] transition-colors mt-1"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="w-full bg-white border-t border-border/50 py-8 px-6 text-center">
        <p className="text-sm text-[#434655]">© 2024 AI Study Hub. All rights reserved.</p>
      </footer>
    </div>
  )
}
