import { useState, useMemo } from 'react'
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  FolderOpen,
  AlertOctagon
} from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AdminDocument } from '../services/adminService'

export function AdminDocumentsTab({
  documents,
  onUpdateDocument,
  onDeleteDocument,
  onApproveDocument,
  onRejectDocument
}: {
  documents: AdminDocument[]
  onUpdateDocument: (id: string, updates: Partial<AdminDocument>) => void
  onDeleteDocument: (id: string) => void
  onApproveDocument: (id: string) => void
  onRejectDocument: (id: string) => void
}) {
  const { t } = useTranslation()
  const toast = useToast()

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  // Selected document states for Preview & Delete Modals
  const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<AdminDocument | null>(null)
  const [activeReportDoc, setActiveReportDoc] = useState<AdminDocument | null>(null)
  const [adminFeedback, setAdminFeedback] = useState('')

  const handleMoveToPending = (id: string, _feedback: string) => {
    onUpdateDocument(id, { status: 'pending' })
    if (previewDoc && previewDoc.id === id) {
      setPreviewDoc((prev) => (prev ? { ...prev, status: 'pending' } : null))
    }
    toast.success(t.admin.toastMovePendingSuccess || 'Moved to pending')
    setActiveReportDoc(null)
  }

  // Filtering logic
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [documents, searchTerm, statusFilter])

  // Moderate Actions
  const handleApprove = (id: string) => {
    onApproveDocument(id)
    if (previewDoc && previewDoc.id === id) {
      setPreviewDoc((prev) => (prev ? { ...prev, status: 'approved' } : null))
    }
    toast.success(t.admin.toastApproveSuccess || 'Document approved')
  }
  
  const handleReject = (id: string) => {
    onRejectDocument(id)
    if (previewDoc && previewDoc.id === id) {
      setPreviewDoc((prev) => (prev ? { ...prev, status: 'rejected' } : null))
    }
    toast.success('Document rejected')
  }

  const handleDeleteConfirm = () => {
    if (!deleteDoc) return
    onDeleteDocument(deleteDoc.id)
    if (previewDoc && previewDoc.id === deleteDoc.id) {
      setPreviewDoc(null)
    }
    toast.success(t.admin.toastDeleteSuccess || 'Document deleted')
    setDeleteDoc(null)
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.admin.searchDocsPlaceholder || 'Search documents...'}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Filters pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => {
            const getLabel = () => {
              switch (filter) {
                case 'all': return t.common?.all || 'All'
                case 'pending': return t.admin?.statusPending || 'Pending'
                case 'approved': return t.admin?.statusApproved || 'Approved'
                case 'rejected': return 'Rejected/Reported'
              }
            }
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
                {getLabel()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Documents Moderation Table */}
      <Card className="rounded-[28px] overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 select-none">
                <th className="p-4 pl-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin?.docColName || 'Name'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin?.docColType || 'Type'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin?.docColUploader || 'Uploader'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin?.docColDate || 'Date'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin?.docColSize || 'Size'}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin?.docColStatus || 'Status'}</th>
                <th className="p-4 pr-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t.admin?.docColActions || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => {
                  const getStatusBadge = () => {
                    switch (doc.status) {
                      case 'approved':
                        return (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {t.admin?.statusApproved || 'Approved'}
                          </Badge>
                        )
                      case 'pending':
                        return (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {t.admin?.statusPending || 'Pending'}
                          </Badge>
                        )
                      case 'rejected':
                        return (
                          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px]">
                            <AlertTriangle className="size-3 text-rose-500" />
                            Rejected
                          </Badge>
                        )
                    }
                  };

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors group"
                    >
                      {/* Name */}
                      <td className="p-4 pl-6 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex flex-col">
                          <span className="text-[14px] leading-tight truncate max-w-[280px]" title={doc.title}>
                            {doc.title}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[280px] mt-0.5">
                            {doc.title}.{doc.fileType}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-4">
                        <span className="inline-flex items-center justify-center text-[10px] font-extrabold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-md uppercase">
                          {doc.fileType}
                        </span>
                      </td>

                      {/* Uploader */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-350">{doc.ownerName}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{doc.ownerEmail}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-medium text-xs">
                        {doc.uploadedAt}
                      </td>

                      {/* Size */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-medium text-xs">
                        {doc.sizeMB} MB
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {getStatusBadge()}
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Report details button if reported */}
                          {doc.status === 'rejected' && (
                            <button
                              onClick={() => {
                                setActiveReportDoc(doc)
                              }}
                              className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:text-amber-450 dark:hover:text-amber-400 dark:hover:bg-amber-950/40 transition-all cursor-pointer"
                              title="Details"
                              aria-label="Details"
                            >
                              <AlertOctagon className="size-4.5" />
                            </button>
                          )}

                          {/* Preview button */}
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-all cursor-pointer"
                            title={t.admin?.actionPreview || 'Preview'}
                            aria-label={t.admin?.actionPreview || 'Preview'}
                          >
                            <Eye className="size-4.5" />
                          </button>

                          {/* Approve button */}
                          {doc.status !== 'approved' ? (
                            <button
                              onClick={() => handleApprove(doc.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all cursor-pointer"
                              title={t.admin?.actionApprove || 'Approve'}
                              aria-label={t.admin?.actionApprove || 'Approve'}
                            >
                              <CheckCircle className="size-4.5" />
                            </button>
                          ) : (
                            <div className="w-7 h-7 flex items-center justify-center text-emerald-500">
                              <ShieldCheck className="size-4.5" />
                            </div>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={() => setDeleteDoc(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-450 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                            title={t.admin?.actionDelete || 'Delete'}
                            aria-label={t.admin?.actionDelete || 'Delete'}
                          >
                            <Trash2 className="size-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-650">
                      <FolderOpen className="size-10 stroke-[1.25] mb-2" />
                      <p className="font-extrabold text-sm text-slate-700 dark:text-slate-350">{t.admin?.noDocs || "No documents found"}</p>
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">{t.admin?.noDocsModeration || "No documents match"}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 1. DOCUMENT PREVIEW MODAL */}
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || ''}
        description={previewDoc ? `Uploader: ${previewDoc.ownerName} (${previewDoc.ownerEmail})` : undefined}
        className="max-w-3xl"
      >
        {previewDoc && (
          <div className="space-y-6">
            {/* File info bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">{t.admin?.docColType || 'Type'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{previewDoc.fileType}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">{t.admin?.docColSize || 'Size'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewDoc.sizeMB} MB</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">{t.admin?.docColDate || 'Date'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewDoc.uploadedAt}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">{t.admin?.docColStatus || 'Status'}</span>
                <span className="font-bold text-slate-850 dark:text-slate-150">
                  {previewDoc.status === 'approved' && <span className="text-emerald-500 font-extrabold">{t.admin?.statusApproved || 'Approved'}</span>}
                  {previewDoc.status === 'pending' && <span className="text-amber-500 font-extrabold">{t.admin?.statusPending || 'Pending'}</span>}
                  {previewDoc.status === 'rejected' && <span className="text-rose-500 font-extrabold">Rejected</span>}
                </span>
              </div>
            </div>

            {/* Simulated Content Screen */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="size-3.5" />
                {t.admin?.previewContentTitle || 'Content Preview'}
              </h4>
              <div className="bg-slate-950 text-slate-200 p-6 rounded-2xl font-mono text-xs overflow-x-auto min-h-[180px] max-h-[300px] border border-slate-850 shadow-inner">
                <div className="py-1 border-b border-slate-850 last:border-0 truncate">
                  <span className="text-slate-600 dark:text-slate-550 select-none mr-4">01</span>
                  <span>{previewDoc.title}</span>
                </div>
                <div className="py-1 border-b border-slate-850 last:border-0 truncate">
                  <span className="text-slate-600 dark:text-slate-550 select-none mr-4">02</span>
                  <span>Category: {previewDoc.category}</span>
                </div>
                <div className="py-1 border-b border-slate-850 last:border-0 truncate">
                  <span className="text-slate-600 dark:text-slate-550 select-none mr-4">03</span>
                  <span>AI Status: {previewDoc.aiStatus}</span>
                </div>
              </div>
            </div>

            {/* Footer actions inside preview */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button
                variant="secondary"
                onClick={() => setPreviewDoc(null)}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {t.common?.close || 'Close'}
              </Button>

              <div className="flex items-center gap-2">
                {previewDoc.status !== 'rejected' && (
                  <Button
                    onClick={() => handleReject(previewDoc.id)}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <AlertTriangle className="size-3.5" />
                    Reject
                  </Button>
                )}
                {previewDoc.status !== 'approved' && (
                  <Button
                    onClick={() => {
                      handleApprove(previewDoc.id);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle className="size-3.5" />
                    {t.admin?.actionApprove || 'Approve'}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setDeleteDoc(previewDoc);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trash2 className="size-3.5" />
                  {t.admin?.actionDelete || 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. CONFIRM DELETE DIALOG */}
      <Modal
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        title={t.admin?.confirmDeleteTitle || 'Delete'}
        className="max-w-md"
      >
        {deleteDoc && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl">
              <AlertTriangle className="size-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-sm text-rose-950 dark:text-rose-200 leading-tight">
                  Warning
                </p>
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-350/80 leading-relaxed">
                  {t.admin?.confirmDeleteDesc || 'Are you sure you want to delete this document?'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
              {deleteDoc.title} ({deleteDoc.title}.{deleteDoc.fileType})
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                onClick={() => setDeleteDoc(null)}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {t.common?.cancel || 'Cancel'}
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer shadow-md"
              >
                {t.common?.confirm || 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. VIOLATION REPORT DETAILS DIALOG */}
      <Modal
        isOpen={!!activeReportDoc}
        onClose={() => setActiveReportDoc(null)}
        title={t.admin?.reportModalTitle || 'Report Details'}
        className="max-w-xl"
      >
        {activeReportDoc && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs space-y-3.5">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">
                  AI Status
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activeReportDoc.aiStatus}
                </span>
              </div>
            </div>

            {/* Admin feedback field */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">
                {t.admin?.adminFeedbackLabel || 'Admin Feedback'}
              </label>
              <textarea
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                placeholder="Notes..."
                className="w-full h-24 p-3.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-650 font-medium leading-relaxed resize-none transition-all"
              />
            </div>

            {/* Footer actions inside report modal */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button
                variant="secondary"
                onClick={() => setActiveReportDoc(null)}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {t.common?.cancel || 'Cancel'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleMoveToPending(activeReportDoc.id, adminFeedback)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {t.admin?.actionMovePending || 'Move to pending'}
                </Button>
                <Button
                  onClick={() => {
                    setDeleteDoc(activeReportDoc);
                    setActiveReportDoc(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trash2 className="size-3.5" />
                  {t.admin?.actionDelete || 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

