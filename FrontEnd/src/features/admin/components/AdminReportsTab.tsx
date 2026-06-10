import { useState, useEffect } from 'react'
import { CheckCircle, Eye, HelpCircle, Loader2 } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import { adminService } from '../services/adminService'

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
  const [tickets, setTickets] = useState<ReportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true)
      try {
        const data = await adminService.getReports()
        if (Array.isArray(data)) {
          const mapped: ReportTicket[] = data.map((r: any) => ({
            id: String(r.id),
            reportedFile: r.reportedFile || 'Reported Shared Document',
            reportedFileId: String(r.documentId),
            reporter: r.reporterName || 'Student User',
            reporterEmail: r.reporterEmail,
            timestamp: r.createdAt ? r.createdAt.replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16),
            reason: r.reason,
            status: (r.status as 'pending' | 'resolved' | 'ignored') || 'pending'
          }))
          setTickets(mapped)
        }
      } catch (err) {
        console.error("Failed to load reports", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadReports()
  }, [])

  // Resolve Action
  const handleResolve = async (id: string) => {
    try {
      await adminService.updateReportStatus(id, 'resolved')
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'resolved' as const } : t))
      )
      const msg = language === 'vi' ? 'Đã giải quyết báo cáo thành công' : 'Report ticket marked as resolved'
      toast.success(msg)
      setSelectedTicket(null)
    } catch (err) {
      toast.error(language === 'vi' ? 'Không thể cập nhật báo cáo' : 'Failed to update report status')
    }
  }

  // Ignore Action
  const handleIgnore = async (id: string) => {
    try {
      await adminService.updateReportStatus(id, 'ignored')
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'ignored' as const } : t))
      )
      const msg = language === 'vi' ? 'Đã bỏ qua báo cáo' : 'Report ticket ignored'
      toast.success(msg)
      setSelectedTicket(null)
    } catch (err) {
      toast.error(language === 'vi' ? 'Không thể cập nhật báo cáo' : 'Failed to update report status')
    }
  }

  return (
    <div className="space-y-6 select-none text-left">
      {/* Table section */}
      <Card className="rounded-[28px] overflow-hidden shadow-md">
        <div className="overflow-x-auto overflow-y-auto max-h-[580px] scrollbar-thin relative z-0">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pl-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Mã báo cáo' : 'Report ID'}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Tệp bị báo cáo' : 'Reported File'}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Người báo cáo' : 'Reporter'}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Lý do' : 'Reason'}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Thời gian' : 'Date'}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pr-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="size-5 animate-spin" />
                      <span>{language === 'vi' ? 'Đang tải báo cáo...' : 'Loading reports...'}</span>
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {language === 'vi' ? 'Không có báo cáo vi phạm nào.' : 'No violation reports found.'}
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-100/70 dark:hover:bg-slate-800/40 even:bg-slate-50/40 dark:even:bg-slate-900/20 transition-all duration-200 group"
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
                      {t.status === 'pending'
                        ? (language === 'vi' ? 'CHỜ XỬ LÝ' : 'PENDING')
                        : t.status === 'resolved'
                        ? (language === 'vi' ? 'ĐÃ GIẢI QUYẾT' : 'RESOLVED')
                        : (language === 'vi' ? 'ĐÃ BỎ QUA' : 'IGNORED')}
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
                ))
              )}
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
