import { useTranslation } from '@/context/LanguageContext'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TermsOfServicePage() {
  const { language } = useTranslation()
  const navigate = useNavigate()
  
  const isVi = language === 'vi'

  const content = {
    title: isVi ? 'Điều khoản dịch vụ' : 'Terms of Service',
    subtitle: isVi 
      ? 'Vui lòng đọc kỹ các điều khoản này trước khi sử dụng AI Study Hub.' 
      : 'Please read these terms carefully before using AI Study Hub.',
    sections: [
      {
        title: isVi ? '1. Chấp nhận điều khoản' : '1. Acceptance of Terms',
        text: isVi 
          ? 'Bằng việc sử dụng AI Study Hub, bạn đồng ý tuân thủ các điều khoản này và sử dụng nền tảng một cách có trách nhiệm.' 
          : 'By using AI Study Hub, you agree to follow these terms and use the platform responsibly.'
      },
      {
        title: isVi ? '2. Trách nhiệm của người dùng' : '2. User Responsibilities',
        text: isVi 
          ? 'Người dùng chịu trách nhiệm đối với các tài liệu mà họ tải lên, chia sẻ và quản lý trên nền tảng.' 
          : 'Users are responsible for the documents they upload, share, and manage on the platform.'
      },
      {
        title: isVi ? '3. Tính trung thực học thuật' : '3. Academic Integrity',
        text: isVi 
          ? 'Người dùng không được tải lên các nội dung đạo văn, bất hợp pháp, gây hại hoặc gây hiểu nhầm.' 
          : 'Users must not upload plagiarized, illegal, harmful, or misleading content.'
      },
      {
        title: isVi ? '4. Tính năng AI' : '4. AI Features',
        text: isVi 
          ? 'Các bản tóm tắt, câu hỏi trắc nghiệm, flashcard và gợi ý từ AI được tạo ra chỉ với mục đích hỗ trợ học tập và có thể cần người dùng xác minh.' 
          : 'AI summaries, quizzes, flashcards, and recommendations are generated for study support only and may require user verification.'
      },
      {
        title: isVi ? '5. Chia sẻ tài liệu' : '5. Document Sharing',
        text: isVi 
          ? 'Tài liệu được chia sẻ phải tôn trọng bản quyền, quyền riêng tư và các quy định học thuật.' 
          : 'Shared documents must respect copyright, privacy, and academic rules.'
      },
      {
        title: isVi ? '6. Kiểm duyệt của quản trị viên' : '6. Admin Moderation',
        text: isVi 
          ? 'Quản trị viên có thể xem xét, hạn chế hoặc xóa nội dung vi phạm chính sách của nền tảng.' 
          : 'Administrators may review, restrict, or remove content that violates platform policies.'
      },
      {
        title: isVi ? '7. Bảo mật tài khoản' : '7. Account Security',
        text: isVi 
          ? 'Người dùng có trách nhiệm giữ an toàn cho thông tin đăng nhập tài khoản của mình.' 
          : 'Users are responsible for keeping their account credentials secure.'
      },
      {
        title: isVi ? '8. Thay đổi điều khoản' : '8. Changes to Terms',
        text: isVi 
          ? 'Chúng tôi có thể cập nhật các điều khoản này khi cần thiết để cải thiện tính an toàn và sự tuân thủ.' 
          : 'We may update these terms when necessary to improve safety and compliance.'
      }
    ],
    lastUpdated: isVi ? 'Cập nhật lần cuối: 2026' : 'Last updated: 2026',
    backBtn: isVi ? 'Quay lại trang chủ' : 'Back to Home'
  }

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans flex flex-col">
      {/* ── Header ── */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3.5">
            <img src="/logo.png" alt="LumiEdu Logo" className="w-[68px] h-[68px] object-contain" />
            <span className="text-2xl font-bold text-[#2563eb] dark:text-blue-400 tracking-tight">LumiEdu</span>
          </Link>
          <button
            onClick={handleBack}
            className="text-sm font-semibold text-[#434655] dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors flex items-center gap-2 cursor-pointer bg-transparent border-none"
          >
            <ArrowLeft className="w-4 h-4" /> {content.backBtn}
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12">
            <header className="mb-10 text-center">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {content.title}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                {content.subtitle}
              </p>
            </header>

            <div className="space-y-8">
              {content.sections.map((section, index) => (
                <section key={index}>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    {section.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {section.text}
                  </p>
                </section>
              ))}
            </div>

            <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 text-sm text-center">
              {content.lastUpdated}
            </footer>
          </div>
        </div>
      </main>
    </div>
  )
}
