import { useState } from 'react'
import { CheckCircle, Eye, HelpCircle } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

interface ReportTicket {
  id: string
  reportedFile: string
  reportedFileId: string
  reporter: string
  reporterEmail: string
  reason: string
  timestamp: string
  status: 'pending' | 'resolved' | 'ignored'
}

export function AdminReportsTab() {
  const { language } = useTranslation()
  const toast = useToast()
  const [selectedTicket, setSelectedTicket] = useState<ReportTicket | null>(null)

  const [tickets, setTickets] = useState<ReportTicket[]>([
    {
      id: 'rep-1',
      reportedFile: 'Violating_Exam_Leaks_2026.pdf',
      reportedFileId: 'doc-4',
      reporter: 'Sarah Jenkins',
      reporterEmail: 'sarah.j@school.edu',
      timestamp: '2026-05-25 10:15',
      reason: 'Tài liệu này chứa nội dung rò rỉ đề thi cuối kỳ, vi phạm quy chế học tập nghiêm trọng.',
      status: 'pending'
    },
    {
      id: 'rep-2',
      reportedFile: 'Unfinished_Physics_Draft.docx',
      reportedFileId: 'doc-6',
      reporter: 'Emma Watson',
      reporterEmail: 'emma@example.com',
      timestamp: '2026-05-23 09:44',
      reason: 'Tài liệu này sao chép toàn bộ nội dung từ sách giáo trình Physics Mechanics của trường mà chưa được sự cho phép.',
      status: 'pending'
    },
    {
      id: 'rep-3',
      reportedFile: 'Spam_Marketing_101.pdf',
      reportedFileId: 'doc-9',
      reporter: 'David Kim',
      reporterEmail: 'david.kim@university.edu',
      timestamp: '2026-05-22 14:02',
      reason: 'Quảng cáo khóa học đa cấp không liên quan đến học thuật, làm rác không gian chung.',
      status: 'resolved'
    },
    {
      id: 'rep-4',
      reportedFile: 'Math_Calculus_Notes.pdf',
      reportedFileId: 'doc-10',
      reporter: 'Huynh Duy Binh',
      reporterEmail: 'binh@example.com',
      timestamp: '2026-05-20 16:30',
      reason: 'Nhầm lẫn về bản quyền, đây thực tế là tài liệu cá nhân tự biên soạn của tôi bị người khác chia sẻ lại.',
      status: 'ignored'
    }
  ])

  // Resolve Action
  const handleResolve = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'resolved' } : t))
    )
    const msg = language === 'vi' ? 'Đã giải quyết báo cáo thành công' : 'Report ticket marked as resolved'
    toast.success(msg)
    setSelectedTicket(null)
  }

  // Ignore Action
  const handleIgnore = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'ignored' } : t))
    )
    const msg = language === 'vi' ? 'Đã bỏ qua báo cáo' : 'Report ticket ignored'
    toast.success(msg)
    setSelectedTicket(null)
  }

  return (
    <div className="space-y-6 select-none text-left">
      {/* Table section */}
      <Card className="rounded-[28px] overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="p-4 pl-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{language === 'vi' ? 'Mã báo cáo' : 'Report ID'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{language === 'vi' ? 'Tệp bị báo cáo' : 'Reported File'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{language === 'vi' ? 'Người báo cáo' : 'Reporter'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{language === 'vi' ? 'Lý do' : 'Reason'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{language === 'vi' ? 'Thời gian' : 'Date'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="p-4 pr-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors group"
                >
                  <td className="p-4 pl-6 font-extrabold text-slate-800 dark:text-slate-200">
                    {t.id}
                  </td>
                  <td className="p-4 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    {t.reportedFile}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-700 dark:text-slate-350">{t.reporter}</span>
                      <span className="text-[10px] text-slate-405 dark:text-slate-500 mt-0.5">{t.reporterEmail}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-550 dark:text-slate-400 max-w-[240px] truncate" title={t.reason}>
                    {t.reason}
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                    {t.timestamp}
                  </td>
                  <td className="p-4">
                    <Badge className={cn(
                      "font-extrabold text-[10px] rounded-full px-2.5 py-0.5 border flex items-center gap-1.5 w-fit",
                      t.status === 'pending' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15",
                      t.status === 'resolved' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15",
                      t.status === 'ignored' && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-450 border-slate-200 dark:border-slate-700"
                    )}>
                      <span className={cn(
                        "size-1.5 rounded-full",
                        t.status === 'pending' && "bg-amber-50 animate-pulse",
                        t.status === 'resolved' && "bg-emerald-500",
                        t.status === 'ignored' && "bg-slate-400"
                      )} />
                      {t.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* View details */}
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-955/20 transition-all cursor-pointer"
                        title={language === 'vi' ? 'Xem chi tiết' : 'View details'}
                      >
                        <Eye className="size-4" />
                      </button>

                      {t.status === 'pending' && (
                        <>
                          {/* Resolve ticket */}
                          <button
                            onClick={() => handleResolve(t.id)}
                            className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all cursor-pointer"
                            title={language === 'vi' ? 'Giải quyết' : 'Resolve'}
                          >
                            <CheckCircle className="size-4" />
                          </button>

                          {/* Ignore ticket */}
                          <button
                            onClick={() => handleIgnore(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            title={language === 'vi' ? 'Bỏ qua' : 'Ignore'}
                          >
                            <HelpCircle className="size-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Ticket Details Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={language === 'vi' ? 'Chi tiết báo cáo vi phạm' : 'Report Ticket Details'}
        className="max-w-md"
      >
        {selectedTicket && (
          <div className="space-y-5 text-slate-800 dark:text-slate-200">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                {language === 'vi' ? 'TỆP BỊ BÁO CÁO' : 'REPORTED FILE'}
              </h3>
              <p className="text-base font-extrabold text-slate-850 dark:text-white leading-tight">
                {selectedTicket.reportedFile}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs leading-normal">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                  {language === 'vi' ? 'NGƯỜI BÁO CÁO' : 'REPORTER'}
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-300">{selectedTicket.reporter}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                  {language === 'vi' ? 'EMAIL' : 'REPORTER EMAIL'}
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-400">{selectedTicket.reporterEmail}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                  {language === 'vi' ? 'THỜI GIAN GỬI' : 'SUBMITTED DATE'}
                </span>
                <span className="font-semibold text-slate-750 dark:text-slate-350">{selectedTicket.timestamp}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block mb-1.5">
                  {language === 'vi' ? 'LÝ DO TỐ CÁO' : 'VIOLATION DETAILS'}
                </span>
                <p className="text-xs font-semibold text-slate-655 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-3 rounded-xl">
                  {selectedTicket.reason}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => setSelectedTicket(null)}
                className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </Button>
              {selectedTicket.status === 'pending' && (
                <>
                  <Button
                    onClick={() => handleIgnore(selectedTicket.id)}
                    className="bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-750 dark:text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    {language === 'vi' ? 'Bỏ qua' : 'Ignore'}
                  </Button>
                  <Button
                    onClick={() => handleResolve(selectedTicket.id)}
                    className="bg-[#3155F6] hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer shadow-md shadow-blue-500/10"
                  >
                    {language === 'vi' ? 'Giải quyết xong' : 'Mark Resolved'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
