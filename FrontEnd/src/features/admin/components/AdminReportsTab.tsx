import { useState, useMemo } from 'react'
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  Trash2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  FolderOpen
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DocumentReport } from '../../shared-files/services/reportService'

export function AdminReportsTab({
  reports,
  onRefresh,
  onMarkReviewed,
  onRejectReport,
  onRemoveDocument
}: {
  reports: DocumentReport[]
  onRefresh: () => void
  onMarkReviewed: (id: string, note?: string) => void
  onRejectReport: (id: string, note?: string) => void
  onRemoveDocument: (id: string, note?: string) => void
}) {
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'rejected' | 'removed'>('all')

  // Selected report states for Modals
  const [activeReport, setActiveReport] = useState<DocumentReport | null>(null)
  const [adminNote, setAdminNote] = useState('')

  // Filtering logic
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.sharedBy.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || report.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [reports, searchTerm, statusFilter])

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed' || r.status === 'rejected').length,
    removed: reports.filter(r => r.status === 'removed').length,
  }

  const handleAction = (action: 'review' | 'reject' | 'remove') => {
    if (!activeReport) return
    if (action === 'review') onMarkReviewed(activeReport.id, adminNote)
    if (action === 'reject') onRejectReport(activeReport.id, adminNote)
    if (action === 'remove') {
      if (window.confirm('Are you sure you want to remove this document?')) {
        onRemoveDocument(activeReport.id, adminNote)
      } else {
        return
      }
    }
    setActiveReport(null)
    setAdminNote('')
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng báo cáo</span>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.total}</span>
        </div>
        <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 p-4 rounded-3xl backdrop-blur-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider">Đang chờ duyệt</span>
          <span className="text-2xl font-black text-orange-700 dark:text-orange-400">{stats.pending}</span>
        </div>
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 p-4 rounded-3xl backdrop-blur-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider">Đã xử lý</span>
          <span className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.reviewed}</span>
        </div>
        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-4 rounded-3xl backdrop-blur-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider">Tài liệu đã gỡ</span>
          <span className="text-2xl font-black text-rose-700 dark:text-rose-400">{stats.removed}</span>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents or users..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Filters pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {(['all', 'pending', 'reviewed', 'rejected', 'removed'] as const).map((filter) => {
            const isActive = statusFilter === filter
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white dark:bg-blue-600'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            )
          })}
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
          
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-all cursor-pointer flex items-center gap-1.5 px-3 border border-slate-200 dark:border-slate-800"
            title="Làm mới"
          >
            <RefreshCw className="size-4" />
            <span className="text-xs font-bold">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <Card className="rounded-[28px] overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 select-none">
                <th className="p-4 pl-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Document</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reason</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reported By</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                <th className="p-4 pr-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const getStatusBadge = () => {
                    switch (report.status) {
                      case 'reviewed':
                        return (
                          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px]">
                            Reviewed
                          </Badge>
                        )
                      case 'pending':
                        return (
                          <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            Pending
                          </Badge>
                        )
                      case 'rejected':
                        return (
                          <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px]">
                            Rejected
                          </Badge>
                        )
                      case 'removed':
                        return (
                          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px]">
                            Removed
                          </Badge>
                        )
                    }
                  };

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer"
                      onClick={() => {
                        setActiveReport(report);
                        setAdminNote(report.adminNote || '');
                      }}
                    >
                      {/* Name */}
                      <td className="p-4 pl-6 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex flex-col">
                          <span className="text-[14px] leading-tight truncate max-w-[240px]" title={report.documentName}>
                            {report.documentName}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                            Shared by {report.sharedBy}
                          </span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{report.reason}</span>
                          <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]" title={report.description}>
                            {report.description}
                          </span>
                        </div>
                      </td>

                      {/* Reported By */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-350">{report.reportedBy}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{report.reportedByEmail}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {getStatusBadge()}
                      </td>

                      {/* Created */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-medium text-xs">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <Button
                          variant="secondary"
                          className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700 font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-650">
                      <FolderOpen className="size-10 stroke-[1.25] mb-2" />
                      <p className="font-extrabold text-sm text-slate-700 dark:text-slate-350">No reports found</p>
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">There are currently no reports matching your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* REPORT DETAILS MODAL */}
      <Modal
        isOpen={!!activeReport}
        onClose={() => setActiveReport(null)}
        title="Report Details"
        className="max-w-2xl"
      >
        {activeReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">Document Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="size-3.5 text-slate-400" />
                  {activeReport.documentName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">Status</span>
                <span className="font-bold capitalize text-slate-850 dark:text-slate-150">
                  {activeReport.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">Reported By</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activeReport.reportedBy} ({activeReport.reportedByEmail})
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">Shared By</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activeReport.sharedBy}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Reason</h4>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl">
                  {activeReport.reason}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Description</h4>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {activeReport.description}
                </div>
              </div>

              {activeReport.evidenceLink && (
                <div>
                  <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Evidence Link</h4>
                  <a href={activeReport.evidenceLink} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:underline">
                    {activeReport.evidenceLink}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">
                Admin Note
              </label>
              {activeReport.status === 'pending' ? (
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add an admin note..."
                  className="w-full h-24 p-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-650 font-medium leading-relaxed resize-none transition-all"
                />
              ) : (
                <div className="w-full p-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {activeReport.adminNote || 'No notes provided.'}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button
                variant="secondary"
                onClick={() => setActiveReport(null)}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Close
              </Button>

              {activeReport.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleAction('reject')}
                    className="bg-slate-600 hover:bg-slate-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <XCircle className="size-3.5" />
                    Reject Report
                  </Button>
                  <Button
                    onClick={() => handleAction('remove')}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Trash2 className="size-3.5" />
                    Remove Document
                  </Button>
                  <Button
                    onClick={() => handleAction('review')}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle className="size-3.5" />
                    Mark as Reviewed
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
