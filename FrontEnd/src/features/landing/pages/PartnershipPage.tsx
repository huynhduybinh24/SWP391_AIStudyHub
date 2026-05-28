import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  GraduationCap, 
  Users, 
  Bot, 
  PenTool, 
  Briefcase, 
  Megaphone, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Loader2
} from 'lucide-react';
import { AppFooter } from '@/components/shared/AppFooter';
import { partnershipService } from '@/services/partnershipService';
import { useAuthStore } from '@/stores/authStore';

const PARTNERSHIP_TYPES = [
  {
    id: 'Educational Partnership',
    title: 'Educational Partnership',
    description: 'Collaborate with universities, schools, or learning centers to integrate our AI tools into your curriculum.',
    icon: GraduationCap,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10'
  },
  {
    id: 'Mentor Collaboration',
    title: 'Mentor Collaboration',
    description: 'Join our network of expert mentors to provide guidance and shape the next generation of learners.',
    icon: Users,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10'
  },
  {
    id: 'AI Integration',
    title: 'AI Integration',
    description: 'Integrate our powerful document analysis and generative AI models into your existing platform.',
    icon: Bot,
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-500/10'
  },
  {
    id: 'Content Creator',
    title: 'Content Creator',
    description: 'Partner with us to create engaging educational content, tutorials, or study materials for our users.',
    icon: PenTool,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-500/10'
  },
  {
    id: 'Business / Sponsorship',
    title: 'Business / Sponsorship',
    description: 'Sponsor our events, hackathons, or provide exclusive offers to our student community.',
    icon: Briefcase,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-500/10'
  },
  {
    id: 'Recruitment Collaboration',
    title: 'Recruitment',
    description: 'Connect with top-tier students and graduates who use AI Study Hub for their career journey.',
    icon: Megaphone,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-500/10'
  }
];

const FAQS = [
  {
    id: 1,
    question: 'How long does it take to review a partnership request?',
    answer: 'We typically review and respond to all partnership inquiries within 2-3 business days. For urgent requests, please indicate so in your message.'
  },
  {
    id: 2,
    question: 'Can students become collaborators?',
    answer: 'Absolutely! We have a dedicated Student Ambassador program. If you are a student leader, select "Content Creator" or "Other" and mention your university.'
  },
  {
    id: 3,
    question: 'Do you support university or training center partnerships?',
    answer: 'Yes, we offer specialized institutional plans that include custom AI integrations, bulk licensing, and dedicated support for your educators and students.'
  }
];

export function PartnershipPage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Form State
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    organization: '',
    partnershipType: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!form.organization.trim()) newErrors.organization = 'Organization is required.';
    if (!form.partnershipType) newErrors.partnershipType = 'Please select a partnership type.';
    if (!form.message.trim() || form.message.trim().length < 20) {
      newErrors.message = 'Message must be at least 20 characters long.';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    
    try {
      await partnershipService.submitRequest(form);
      setIsSuccess(true);
      setForm({
        fullName: '',
        email: '',
        organization: '',
        partnershipType: '',
        message: ''
      });
    } catch (error) {
      console.error('Failed to submit partnership request', error);
      alert('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById('partnership-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans flex flex-col">
      {/* Header */}
      <header className="w-full bg-white dark:bg-slate-950 border-b border-border/50 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3.5">
            <img src="/logo.png" alt="AI Study Hub Logo" className="w-[68px] h-[68px] object-contain" />
            <span className="text-2xl font-bold text-primary dark:text-blue-500 tracking-tight">AI Study Hub</span>
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-[#434655] dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 transition-colors flex items-center gap-2 cursor-pointer bg-transparent border-none"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full bg-[#0F172A] py-24 px-6 text-center overflow-hidden border-b border-slate-800">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-[800px] mx-auto">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-sm font-semibold tracking-wide uppercase mb-6 shadow-sm">
            Partner With Us
          </div>
          <h1 className="text-4xl md:text-[56px] font-heading font-bold mb-6 tracking-tight text-white drop-shadow-md leading-[1.1]">
            Let's build the future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">AI learning</span> together.
          </h1>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Join forces with AI Study Hub to empower students worldwide. Whether you're an educator, an organization, or a visionary, we provide the platform to scale your impact.
          </p>
          <button 
            onClick={scrollToForm}
            className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
          >
            Become a Partner
          </button>
        </div>
      </section>

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-20 flex flex-col gap-24">
        
        {/* Partnership Cards */}
        <section>
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">How We Can Collaborate</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Discover the various ways we can partner to create transformative educational experiences.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PARTNERSHIP_TYPES.map((type) => (
              <div 
                key={type.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                onClick={() => {
                  setForm({...form, partnershipType: type.id});
                  scrollToForm();
                }}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${type.bg}`}>
                  <type.icon className={`size-7 ${type.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{type.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{type.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Form and FAQ Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Left Column: Form */}
          <section id="partnership-form" className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Submit a Request</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8">Fill out the form below and our team will get back to you shortly.</p>
              
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-6">
                  <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="size-10 text-green-500" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Request Submitted!</h4>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
                    Thank you for your interest in partnering with us. We've received your request and will review it within 2-3 business days.
                  </p>
                  <button 
                    onClick={() => setIsSuccess(false)}
                    className="px-6 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">Full Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={form.fullName}
                        onChange={(e) => setForm({...form, fullName: e.target.value})}
                        className={`w-full h-12 px-4 rounded-xl border bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${errors.fullName ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                      />
                      {errors.fullName && <p className="text-xs text-red-500 mt-1.5">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">Email Address</label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        className={`w-full h-12 px-4 rounded-xl border bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${errors.email ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                      />
                      {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">Organization / Company</label>
                    <input
                      type="text"
                      placeholder="University of Science, Acme Corp, etc."
                      value={form.organization}
                      onChange={(e) => setForm({...form, organization: e.target.value})}
                      className={`w-full h-12 px-4 rounded-xl border bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${errors.organization ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                    />
                    {errors.organization && <p className="text-xs text-red-500 mt-1.5">{errors.organization}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">Partnership Type</label>
                    <select
                      value={form.partnershipType}
                      onChange={(e) => setForm({...form, partnershipType: e.target.value})}
                      className={`w-full h-12 px-4 rounded-xl border bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors appearance-none ${errors.partnershipType ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                    >
                      <option value="" disabled className="text-slate-500">Select a partnership type...</option>
                      {PARTNERSHIP_TYPES.map(type => (
                        <option key={type.id} value={type.id} className="text-slate-900">{type.title}</option>
                      ))}
                      <option value="Other" className="text-slate-900">Other</option>
                    </select>
                    {errors.partnershipType && <p className="text-xs text-red-500 mt-1.5">{errors.partnershipType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">Message</label>
                    <textarea
                      rows={5}
                      placeholder="Tell us about your organization and how you'd like to collaborate (min 20 characters)..."
                      value={form.message}
                      onChange={(e) => setForm({...form, message: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border bg-transparent text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${errors.message ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                    />
                    {errors.message && <p className="text-xs text-red-500 mt-1.5">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Partnership Request'
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Right Column: Contact & FAQ */}
          <section className="lg:col-span-5 flex flex-col gap-8">
            {/* Contact Info Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Direct Contact</h3>
                <p className="text-blue-100 mb-8 leading-relaxed">
                  Prefer to send an email directly? Reach out to our dedicated partnership team.
                </p>
                <div className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-md">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm text-blue-200 font-medium">Email Us</p>
                    <a href="mailto:partnership@aistudyhub.com" className="text-lg font-bold hover:underline truncate block">
                      partnership@aistudyhub.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Mini Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Frequently Asked Questions</h3>
              <div className="flex flex-col gap-4">
                {FAQS.map((faq) => (
                  <div key={faq.id} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                    <button
                      onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between text-left focus:outline-none group"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pr-4">
                        {faq.question}
                      </span>
                      {activeFaq === faq.id 
                        ? <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      }
                    </button>
                    {activeFaq === faq.id && (
                      <div className="mt-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>

      <AppFooter />
    </div>
  );
}
