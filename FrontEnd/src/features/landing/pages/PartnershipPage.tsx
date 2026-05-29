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
  Loader2,
  AlertCircle,
  AlertTriangle,
  History,
  XCircle,
  Calendar,
  Shield
} from 'lucide-react';
import { AppFooter } from '@/components/shared/AppFooter';
import { partnershipService } from '@/services/partnershipService';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

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

const ORGANIZATIONS_SUGGESTIONS = [
  'FPT University (FPTU)',
  'Hanoi University of Science and Technology (HUST)',
  'Vietnam National University (VNU)',
  'Foreign Trade University (FTU)',
  'Ton Duc Thang University (TDTU)',
  'RMIT University Vietnam',
  'National Economics University (NEU)',
  'Ho Chi Minh City University of Technology (HCMUT)',
  'Hanoi University (HANU)',
  'University of Economics HCMC (UEH)',
  'University of Science HCMC (HCMUS)',
  'Ho Chi Minh City University of Education (HCMUE)',
  'Da Nang University',
  'Can Tho University'
];

export function PartnershipPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const currentUser = useAuthStore((state) => state.user);
  
  // Form State
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    organization: '',
    partnershipType: '',
    message: ''
  });

  // User Requests list & loading state
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'rejected'>('all');

  const fetchUserRequests = async () => {
    if (currentUser?.email) {
      setLoadingRequests(true);
      try {
        const data = await partnershipService.getUserRequests(currentUser.email);
        setUserRequests(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRequests(false);
      }
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, [currentUser]);

  // Determine if form is blocked: blocked if any request is Pending OR (Approved AND they still have a Pro subscription)
  const activeRequest = userRequests.find(req => req.status === 'Pending' || (req.status === 'Approved' && currentUser?.plan === 'pro'));
  const isFormBlocked = !!activeRequest;
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const isTeacher = currentUser?.role?.toLowerCase() === 'teacher' || currentUser?.role?.toLowerCase() === 'instructor';

  // Pre-fill form when currentUser is available
  useEffect(() => {
    if (currentUser) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.name || '',
        email: prev.email || currentUser.email || '',
      }));
    }
  }, [currentUser]);
  
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
    if (isFormBlocked) {
      alert(language === 'vi' ? 'Bạn đang có một yêu cầu hợp tác chưa hoàn thành. Không thể gửi thêm.' : 'You have an active partnership request. Cannot submit another one.');
      return;
    }
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
      
      // Refetch user requests immediately so the block/status takes effect!
      fetchUserRequests();
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm flex flex-col gap-8">
               {isAdmin ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-6">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                    <Shield className="size-10 text-blue-600 animate-pulse" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    {language === 'vi' ? 'Trang quản lý Hợp tác' : 'Partnership Management'}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md leading-relaxed font-medium">
                    {language === 'vi'
                      ? 'Bạn đang truy cập với quyền Quản trị viên. Hãy nhấn nút bên dưới để chuyển đến Trang quản trị của Admin nhằm xem và duyệt các biểu mẫu hợp tác từ Giáo viên.'
                      : 'You are logged in as an Administrator. Click the button below to go to the Admin Dashboard to read, manage, and approve teacher partnership requests.'}
                  </p>
                  <button 
                    onClick={() => navigate('/dashboard/admin?tab=partnership-requests')}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2 border-none"
                  >
                    <Shield className="w-5 h-5" />
                    {language === 'vi' ? 'Đi tới Trang quản trị (Duyệt biểu mẫu)' : 'Go to Admin Dashboard (Approve Forms)'}
                  </button>
                </div>
              ) : !currentUser ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-6">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="size-10 text-blue-600 animate-pulse" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    {language === 'vi' ? 'Yêu cầu Đăng nhập' : 'Login Required'}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md leading-relaxed font-medium">
                    {language === 'vi'
                      ? 'Chương trình Hợp tác Giáo viên chỉ dành riêng cho các tài khoản là Giảng viên. Vui lòng đăng nhập bằng tài khoản Giảng viên của bạn để tiếp tục.'
                      : 'The Teacher Partnership program is exclusively for Teacher accounts. Please log in with your Teacher account to continue.'}
                  </p>
                  <Link 
                    to="/login"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2 border-none no-underline"
                  >
                    {language === 'vi' ? 'Đăng nhập ngay' : 'Log In Now'}
                  </Link>
                </div>
              ) : !isTeacher ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-6">
                  <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-100 dark:border-amber-900/30">
                    <GraduationCap className="size-10 text-amber-500 animate-bounce" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    {language === 'vi' ? 'Quyền truy cập hạn chế' : 'Access Restricted'}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md leading-relaxed font-medium">
                    {language === 'vi'
                      ? 'Chương trình Hợp tác Giáo viên chỉ dành riêng cho tài khoản Giảng viên. Tài khoản hiện tại của bạn có vai trò là Học viên.'
                      : 'The Teacher Partnership program is exclusively for Teacher accounts. Your current account role is Student.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button 
                      onClick={() => {
                        alert(language === 'vi' 
                          ? 'Vui lòng sử dụng tính năng "Đổi người dùng" (Quick Switcher) ở góc trên bên phải thanh menu để chuyển sang tài khoản Giảng viên (ví dụ: Sarah Jenkins).' 
                          : 'Please use the "Change User" (Quick Switcher) at the top right of the header to switch to a Teacher account (e.g., Sarah Jenkins).');
                      }}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer border-none"
                    >
                      {language === 'vi' ? 'Chuyển sang tài khoản Giảng viên' : 'Switch to Teacher Account'}
                    </button>
                    <Link 
                      to="/register"
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer no-underline text-center flex items-center justify-center border border-slate-200 dark:border-slate-700"
                    >
                      {language === 'vi' ? 'Đăng ký tài khoản Giảng viên' : 'Register a Teacher Account'}
                    </Link>
                  </div>
                </div>
              ) : isFormBlocked ? (
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {language === 'vi' ? 'Trạng thái yêu cầu Hợp tác' : 'Partnership Request Status'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {language === 'vi' ? 'Bạn đang có một yêu cầu hợp tác đang được xử lý hoặc đã kích hoạt.' : 'You have an active or processed partnership request in the system.'}
                  </p>
                  
                  {activeRequest.status === 'Pending' ? (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
                      <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-1">
                          {language === 'vi' ? 'Đang chờ phê duyệt' : 'Pending Review'}
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400/90 leading-relaxed">
                          {language === 'vi'
                            ? 'Đơn gửi hợp tác của bạn đã được tiếp nhận và đang chờ quản trị viên phê duyệt. Để tránh gửi trùng lặp hoặc spam, bạn không thể gửi thêm yêu cầu mới lúc này.'
                            : 'Your partnership request has been received and is currently pending administrator approval. To prevent duplicate submissions or spam, you cannot submit a new request at this time.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-6 flex items-start gap-4">
                      <CheckCircle className="w-8 h-8 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-lg font-bold text-green-800 dark:text-green-300 mb-1">
                          {language === 'vi' ? 'Đã phê duyệt thành công! 🎉' : 'Approved Successfully! 🎉'}
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-400/90 leading-relaxed">
                          {language === 'vi'
                            ? 'Chúc mừng! Đơn hợp tác giáo viên của bạn đã được phê duyệt. Tài khoản của bạn đã được nâng cấp lên gói PRO miễn phí với 50 GB dung lượng lưu trữ.'
                            : 'Congratulations! Your teacher partnership request has been approved. Your account has been upgraded to a PRO subscription with 50 GB storage for free.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : isSuccess ? (
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {language === 'vi' ? 'Gửi biểu mẫu Hợp tác' : 'Submit a Request'}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        {language === 'vi' ? 'Điền vào biểu mẫu bên dưới và chúng tôi sẽ liên hệ lại với bạn.' : 'Fill out the form below and our team will get back to you shortly.'}
                      </p>
                    </div>
                    {userRequests.some(r => r.status === 'Rejected') && (
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryFilter('rejected');
                          const historyEl = document.getElementById('rejected-history-section');
                          if (historyEl) {
                            historyEl.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-red-650 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-xl transition-all border border-red-200 dark:border-red-900/30 cursor-pointer shadow-sm shadow-red-500/5 active:scale-[0.98] shrink-0 self-start sm:self-center"
                      >
                        <History className="w-3.5 h-3.5" />
                        {language === 'vi' ? 'Đơn bị từ chối' : 'Rejected Forms'}
                      </button>
                    )}
                  </div>
                  
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

                  <div className="relative">
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">Organization / Company</label>
                    <input
                      type="text"
                      placeholder="University of Science, Acme Corp, etc."
                      value={form.organization}
                      onChange={(e) => {
                        setForm({...form, organization: e.target.value});
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => {
                        // Small timeout to allow suggestion click event to register
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      className={`w-full h-12 px-4 rounded-xl border bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${errors.organization ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                    />
                    {errors.organization && <p className="text-xs text-red-500 mt-1.5">{errors.organization}</p>}

                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestions && (
                      (() => {
                        const val = form.organization.toLowerCase().trim();
                        const matches = val 
                          ? ORGANIZATIONS_SUGGESTIONS.filter(item => 
                              item.toLowerCase().includes(val)
                            )
                          : ORGANIZATIONS_SUGGESTIONS;

                        if (matches.length === 0) return null;

                        return (
                          <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl animate-fade-in divide-y divide-slate-100 dark:divide-slate-800 no-scrollbar">
                            {matches.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setForm({...form, organization: item});
                                  setShowSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        );
                      })()
                    )}
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
                    className="w-full h-12 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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

              {/* Submitted Request History */}
              {userRequests.length > 0 && (
                <div id="rejected-history-section" className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-slate-500" />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                        {language === 'vi' ? 'Lịch sử biểu mẫu Hợp tác' : 'Partnership Request History'}
                      </h4>
                    </div>
                    {userRequests.some(r => r.status === 'Rejected') && (
                      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl gap-1 border border-slate-200/40 dark:border-slate-800/40 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => setHistoryFilter('all')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${historyFilter === 'all' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'}`}
                        >
                          {language === 'vi' ? 'Tất cả' : 'All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryFilter('rejected')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${historyFilter === 'rejected' ? 'bg-red-500 text-white shadow-sm' : 'bg-transparent text-red-500 hover:text-red-600 dark:hover:text-red-400'}`}
                        >
                          {language === 'vi' ? 'Đã từ chối' : 'Rejected'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-1">
                    {userRequests
                      .filter(req => historyFilter === 'all' || req.status === 'Rejected')
                      .map((req) => (
                        <div 
                          key={req.id} 
                          className={`p-5 border rounded-2xl transition-all duration-200 flex flex-col gap-3 ${
                            req.status === 'Rejected' 
                              ? 'border-red-100 dark:border-red-950/30 bg-red-50/10 dark:bg-red-950/5 hover:bg-red-50/20 dark:hover:bg-red-950/10 shadow-sm shadow-red-500/2'
                              : 'border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wide">
                                {language === 'vi' ? 'Loại đối tác' : 'Partnership Type'}
                              </span>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                {req.partnershipType}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {req.status === 'Pending' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/10">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  {language === 'vi' ? 'Đang chờ duyệt' : 'Pending'}
                                </span>
                              )}
                              {req.status === 'Approved' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-100 dark:border-green-500/10">
                                  <CheckCircle className="size-3.5" />
                                  {language === 'vi' ? 'Đã duyệt' : 'Approved'}
                                </span>
                              )}
                              {req.status === 'Rejected' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-750 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/20 shadow-sm shadow-red-500/10">
                                  <XCircle className="size-3.5" />
                                  {language === 'vi' ? 'Đã từ chối' : 'Rejected'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{language === 'vi' ? 'Nội dung tin nhắn:' : 'Message Content:'}</p>
                            <p className="italic bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">{req.message}</p>
                          </div>

                          {req.status === 'Rejected' && req.rejectReason && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100/60 dark:border-red-950/40 p-3.5 rounded-xl flex items-start gap-2.5 shadow-sm shadow-red-500/2">
                              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <div className="text-xs text-red-800 dark:text-red-400 font-medium">
                                <span className="font-bold">{language === 'vi' ? 'Lý do từ chối: ' : 'Reason for rejection: '}</span>
                                {req.rejectReason}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold justify-end border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(req.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
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
