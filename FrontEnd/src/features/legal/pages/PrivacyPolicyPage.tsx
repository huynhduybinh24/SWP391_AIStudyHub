import { useTranslation } from '@/context/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPolicyPage() {
  const { language } = useTranslation()
  const navigate = useNavigate()
  
  const isVi = language === 'vi'

  const content = {
    title: isVi ? 'Chính sách quyền riêng tư' : 'Privacy Policy',
    subtitle: isVi 
      ? 'Quyền riêng tư của bạn rất quan trọng. Chính sách này giải thích cách AI Study Hub xử lý thông tin của bạn.' 
      : 'Your privacy matters to us. This policy explains how AI Study Hub handles your information.',
    sections: [
      {
        title: isVi ? '1. Thông tin chúng tôi thu thập' : '1. Information We Collect',
        text: isVi 
          ? 'Chúng tôi có thể thu thập thông tin tài khoản, tài liệu đã tải lên, tệp được chia sẻ, hoạt động học tập và dữ liệu sử dụng hệ thống.' 
          : 'We may collect account information, uploaded documents, shared files, study activity, and system usage data.'
      },
      {
        title: isVi ? '2. Cách chúng tôi sử dụng thông tin' : '2. How We Use Information',
        text: isVi 
          ? 'Chúng tôi sử dụng dữ liệu để cung cấp tính năng quản lý tài liệu, tóm tắt AI, kế hoạch học tập, thông báo và các tính năng bảo mật.' 
          : 'We use data to provide document management, AI summaries, study plans, notifications, and security features.'
      },
      {
        title: isVi ? '3. Tài liệu đã tải lên' : '3. Uploaded Documents',
        text: isVi 
          ? 'Tài liệu đã tải lên chỉ được sử dụng để hỗ trợ các tính năng học tập như tìm kiếm, tóm tắt và tạo bài kiểm tra.' 
          : 'Uploaded documents are used only to support learning features such as search, summarization, and quiz generation.'
      },
      {
        title: isVi ? '4. Chia sẻ và cộng tác' : '4. Sharing and Collaboration',
        text: isVi 
          ? 'Các tệp được chia sẻ với người dùng khác chỉ hiển thị với những người có quyền truy cập.' 
          : 'Files shared with other users are visible only to users who have permission to access them.'
      },
      {
        title: isVi ? '5. Quản trị viên xem xét' : '5. Admin Review',
        text: isVi 
          ? 'Quản trị viên có thể xem xét các tài liệu bị báo cáo hoặc nội dung đáng ngờ để thực thi tính trung thực học thuật và an toàn nền tảng.' 
          : 'Admins may review reported documents or suspicious content to enforce academic integrity and platform safety.'
      },
      {
        title: isVi ? '6. Lưu trữ dữ liệu' : '6. Data Storage',
        text: isVi 
          ? 'Trong phiên bản này, một số dữ liệu có thể được lưu trữ cục bộ trong trình duyệt bằng localStorage.' 
          : 'In this mock/frontend version, some data may be stored locally in the browser using localStorage.'
      },
      {
        title: isVi ? '7. Quyền kiểm soát của người dùng' : '7. User Control',
        text: isVi 
          ? 'Người dùng có thể cập nhật thông tin hồ sơ, quản lý các tệp đã chia sẻ và yêu cầu xóa tài liệu ở những nơi được hỗ trợ.' 
          : 'Users can update profile information, manage shared files, and request document removal where supported.'
      },
      {
        title: isVi ? '8. Bảo mật' : '8. Security',
        text: isVi 
          ? 'Chúng tôi nỗ lực bảo vệ dữ liệu người dùng thông qua các biện pháp kiểm soát tài khoản và thực hành truy cập an toàn.' 
          : 'We aim to protect user data through account controls and safe access practices.'
      },
      {
        title: isVi ? '9. Cập nhật chính sách' : '9. Updates to Policy',
        text: isVi 
          ? 'Chúng tôi có thể cập nhật chính sách này khi hệ thống phát triển.' 
          : 'We may update this policy as the system evolves.'
      }
    ],
    lastUpdated: isVi ? 'Cập nhật lần cuối: 2026' : 'Last updated: 2026',
    backBtn: isVi ? 'Quay lại' : 'Back to previous page'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span>{content.backBtn}</span>
        </button>

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
    </div>
  )
}
