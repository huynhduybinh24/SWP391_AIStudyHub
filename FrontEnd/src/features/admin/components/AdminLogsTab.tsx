import { useState, useMemo } from 'react'
import { ClipboardList, Search, ShieldAlert, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface SystemLog {
  id: string
  event: string
  category: 'security' | 'subscription' | 'ai-audit' | 'moderation'
  performer: string
  performerEmail: string
  timestamp: string
  details: string
  status: 'success' | 'warning' | 'failed'
}

export function AdminLogsTab() {
  const { language } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'security' | 'subscription' | 'ai-audit' | 'moderation'>('all')

  const [logs] = useState<SystemLog[]>([
    {
      id: 'log-1',
      event: 'Mật khẩu đã khôi phục',
      category: 'security',
      performer: 'Admin User',
      performerEmail: 'admin@example.com',
      timestamp: '2026-05-26 12:45',
      details: 'Khôi phục mật khẩu của người dùng David Kim (david.k@university.edu) về mặc định.',
      status: 'success'
    },
    {
      id: 'log-2',
      event: 'AI Quét tệp phát hiện vi phạm',
      category: 'ai-audit',
      performer: 'AI Guard System',
      performerEmail: 'system@lumiedu.vn',
      timestamp: '2026-05-26 11:20',
      details: 'Tự động báo cáo tài liệu Violating_Exam_Leaks_2026.pdf nghi ngờ vi phạm bản quyền đề thi học thuật.',
      status: 'warning'
    },
    {
      id: 'log-3',
      event: 'Tài khoản người dùng bị khóa',
      category: 'security',
      performer: 'Admin User',
      performerEmail: 'admin@example.com',
      timestamp: '2026-05-26 10:15',
      details: 'Tài khoản david.k@university.edu bị khóa do báo cáo vi phạm nội quy lặp lại.',
      status: 'success'
    },
    {
      id: 'log-4',
      event: 'Nâng cấp gói tài khoản',
      category: 'subscription',
      performer: 'Ngoc Tan',
      performerEmail: 'tan@example.com',
      timestamp: '2026-05-25 18:32',
      details: 'Thanh toán thành công qua cổng Stripe nâng cấp lên gói Pro (50GB).',
      status: 'success'
    },
    {
      id: 'log-5',
      event: 'Phê duyệt tài liệu',
      category: 'moderation',
      performer: 'Admin User',
      performerEmail: 'admin@example.com',
      timestamp: '2026-05-25 14:02',
      details: 'Duyệt tài liệu Neuroscience Fall Syllabus 2024 sạch sau khi kiểm duyệt.',
      status: 'success'
    },
    {
      id: 'log-6',
      event: 'Phát sóng thông báo toàn hệ thống',
      category: 'moderation',
      performer: 'Admin User',
      performerEmail: 'admin@example.com',
      timestamp: '2026-05-24 10:15',
      details: 'Gửi thông báo bảo trì nâng cấp máy chủ AI tháng 6 tới 15,248 học sinh.',
      status: 'success'
    },
    {
      id: 'log-7',
      event: 'Giao dịch thanh toán thất bại',
      category: 'subscription',
      performer: 'Sarah Jenkins',
      performerEmail: 'sarah.j@school.edu',
      timestamp: '2026-05-23 09:44',
      details: 'Thẻ tín dụng hết hạn hoặc số dư không đủ khi tự động gia hạn gói cước Pro.',
      status: 'failed'
    }
  ])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performerEmail.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [logs, searchTerm, categoryFilter])

  return (
    <div className="space-y-6 select-none text-left">
      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'vi' ? 'Tìm kiếm nhật ký...' : 'Search activity logs...'}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 font-semibold"
          />
        </div>

        {/* Filters pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(['all', 'security', 'subscription', 'ai-audit', 'moderation'] as const).map((cat) => {
            const getLabel = () => {
              switch (cat) {
                case 'all': return language === 'vi' ? 'Tất cả' : 'All Logs'
                case 'security': return language === 'vi' ? 'Bảo mật' : 'Security'
                case 'subscription': return language === 'vi' ? 'Gói Pro' : 'Billing'
                case 'ai-audit': return language === 'vi' ? 'AI Quét' : 'AI Audits'
                case 'moderation': return language === 'vi' ? 'Duyệt tài liệu' : 'Moderation'
              }
            }
            const isActive = categoryFilter === cat
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white dark:bg-blue-600'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                {getLabel()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Logs Table */}
      <Card className="rounded-[28px] overflow-hidden shadow-md">
        <div className="overflow-x-auto overflow-y-auto max-h-[580px] scrollbar-thin relative z-0">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pl-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Sự kiện' : 'Event'}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Phân loại' : 'Category'}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Thực hiện' : 'Performer'}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Chi tiết' : 'Details'}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Thời gian' : 'Timestamp'}</th>
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pr-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const getStatusIcon = () => {
                    switch (log.status) {
                      case 'success':
                        return <CheckCircle className="size-4 text-emerald-500" />
                      case 'warning':
                        return <ShieldAlert className="size-4 text-amber-500" />
                      case 'failed':
                        return <XCircle className="size-4 text-rose-500" />
                    }
                  }

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-100/70 dark:hover:bg-slate-800/40 even:bg-slate-50/40 dark:even:bg-slate-900/20 transition-all duration-200 group"
                    >
                      <td className="p-4 pl-6 font-extrabold text-slate-800 dark:text-slate-200">
                        {log.event}
                      </td>

                      <td className="p-4">
                        <Badge className={cn(
                          "font-bold text-[10px] uppercase tracking-wider rounded-full px-2.5 py-0.5",
                          log.category === 'security' && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
                          log.category === 'ai-audit' && "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
                          log.category === 'subscription' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                          log.category === 'moderation' && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        )}>
                          {log.category.toUpperCase()}
                        </Badge>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">{log.performer}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{log.performerEmail}</span>
                        </div>
                      </td>

                      <td className="p-4 text-xs text-slate-550 dark:text-slate-400 leading-normal max-w-[280px] truncate" title={log.details}>
                        {log.details}
                      </td>

                      <td className="p-4 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        {log.timestamp}
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {getStatusIcon()}
                          <span className={cn(
                            "text-xs font-bold uppercase",
                            log.status === 'success' && "text-emerald-500",
                            log.status === 'warning' && "text-amber-500",
                            log.status === 'failed' && "text-rose-500"
                          )}>
                            {log.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-700">
                      <ClipboardList className="size-10 stroke-[1.25] mb-2" />
                      <p className="font-extrabold text-sm text-slate-700 dark:text-slate-350">
                        {language === 'vi' ? 'Không tìm thấy nhật ký hoạt động nào' : 'No activity logs found'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
