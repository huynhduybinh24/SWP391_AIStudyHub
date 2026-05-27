import { useState, useMemo, useEffect } from 'react'
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  Trash2,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  FolderOpen,
  AlertOctagon
} from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

// Types
interface DocumentItem {
  id: string
  title: string
  fileName: string
  type: string
  uploader: string
  uploaderEmail: string
  uploadedAt: string
  size: string
  status: 'pending' | 'approved' | 'reported'
  description?: string
  mockContentLines?: string[]
  reporter?: string
  reportReason?: string
  adminFeedback?: string
}

export function AdminDocumentsTab() {
  const { t, language } = useTranslation()
  const toast = useToast()

  // Mock list of uploaded system documents
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 'doc-1',
      title: 'Neuroscience Fall Syllabus 2024',
      fileName: 'CS101_Syllabus_Introduction.pdf',
      type: 'PDF',
      uploader: 'Alex Rivera',
      uploaderEmail: 'alex@example.com',
      uploadedAt: '2026-05-20',
      size: '2.4 MB',
      status: 'approved',
      description: 'Course syllabus and reading guides outlining neuron structures and synaptic operations.',
      mockContentLines: [
        'Course Syllabus: Advanced Neuro-402 (Fall 2024)',
        'Instructors: Dr. Sarah Jenkins, Prof. Alex Rivera',
        'Section 1.1 Overview of Neuroanatomy and Function',
        'In this section, we cover the anatomical components of neurons, glia cells, and synapses.',
        'Weekly Reading Assignments: Chapter 1-3 in Kandel (6th Edition).',
        'Midterm Exams will be conducted on October 18, 2024.'
      ]
    },
    {
      id: 'doc-2',
      title: 'Genetics Lab Companion Manual',
      fileName: 'Genetics_Lab_Report_CS305.docx',
      type: 'DOCX',
      uploader: 'Emma Watson',
      uploaderEmail: 'emma@example.com',
      uploadedAt: '2026-05-24',
      size: '1.1 MB',
      status: 'pending',
      description: 'CRISPR cellular gene-slicing experiment observations and structural findings.',
      mockContentLines: [
        'Laboratory Companion Notes: Molecular CRISPR Modification Systems',
        'Objective: To observe gene sequence deletions in yeast cell cultures.',
        'Materials: CRISPR-Cas9 enzyme vectors, cell growth medium, fluorescent marker tags.',
        'Protocol Steps:',
        '1. Inoculate yeast cultures in standard liquid nutrient broth.',
        '2. Introduce Cas9 guide RNAs targeting chromosome IV markers.',
        '3. Incubate cultures at 30°C for 48 hours to allow plasmid ingestion.'
      ]
    },
    {
      id: 'doc-3',
      title: 'Multivariable Calculus Formula Reference',
      fileName: 'Advanced_Calculus_CheatSheet.xlsx',
      type: 'XLSX',
      uploader: 'David Kim',
      uploaderEmail: 'david.kim@university.edu',
      uploadedAt: '2026-05-25',
      size: '850 KB',
      status: 'pending',
      description: 'Compact reference table listing double integrals and vector gradient formulas.',
      mockContentLines: [
        'A1: Formula ID | B1: Mathematical Expression | C1: Description',
        'A2: Grad-01    | B2: grad f = (df/dx, df/dy, df/dz) | C2: Gradient vector definition',
        'A3: Div-02     | B3: div F = dP/dx + dQ/dy + dR/dz  | C3: Vector divergence definition',
        'A4: Curl-03    | B4: curl F = rot F                 | C4: Curl rotation formulation',
        'A5: Integ-04   | B5: S(S( f(x,y) dA ))              | C5: Double integrals over region R'
      ]
    },
    {
      id: 'doc-4',
      title: 'Final Exam Cheats Leaked Document',
      fileName: 'Violating_Exam_Leaks_2026.pdf',
      type: 'PDF',
      uploader: 'Spammer User',
      uploaderEmail: 'spammer999@spam.com',
      uploadedAt: '2026-05-25',
      size: '4.2 MB',
      status: 'reported',
      description: 'Supposed answers to the upcoming Software Engineering CS-402 exam.',
      mockContentLines: [
        '*** CONFIDENTIAL LEAKS ***',
        'CS-402 Software Engineering Final Exam Solutions (June 2026)',
        'Question 1: Explain the difference between microservices and monoliths.',
        'Answer Hint: Microservices use separate databases, while monoliths share one.',
        'Question 2: Detail the SOLID principles of Object Oriented Design.',
        'Answer Hint: Single Responsibility, Open/Closed, Liskov, Interface, Dependency.'
      ],
      reporter: 'Sarah Jenkins',
      reportReason: 'Tài liệu này chứa nội dung rò rỉ đề thi cuối kỳ, vi phạm quy chế học tập nghiêm trọng.'
    },
    {
      id: 'doc-5',
      title: 'Integrated Study Companion pptx',
      fileName: 'Integrated_Study_Methods_Companion.pptx',
      type: 'PPTX',
      uploader: 'Sarah Jenkins',
      uploaderEmail: 's.jenkins@school.edu',
      uploadedAt: '2026-05-22',
      size: '12.5 MB',
      status: 'approved',
      description: 'Visual slide companion presenting active retrieval guidelines.',
      mockContentLines: [
        'Slide 1: LumiEdu Study Companions - Illuminate Your Mind',
        'Slide 2: The Cognitive Science of Spaced Retrieval',
        'Slide 3: Why active recall boosts long-term comprehension by 150%',
        'Slide 4: Self-testing strategies and automated quizzes configuration'
      ]
    },
    {
      id: 'doc-6',
      title: 'Physics Mechanics Unfinished Draft',
      fileName: 'Unfinished_Physics_Draft.docx',
      type: 'DOCX',
      uploader: 'David Kim',
      uploaderEmail: 'david.kim@university.edu',
      uploadedAt: '2026-05-23',
      size: '720 KB',
      status: 'reported',
      description: 'Draft describing orbital angular momentum formulations.',
      mockContentLines: [
        'Orbitals Mechanics & Quantum Spinnings',
        'This draft is private and unfinished. Do not distribute.',
        'Formulas: L = r x p (Angular Momentum)',
        'Plagiarized paragraphs from standard textbooks found in this section.'
      ],
      reporter: 'Emma Watson',
      reportReason: 'Tài liệu này sao chép toàn bộ nội dung từ sách giáo trình Physics Mechanics của trường mà chưa được sự cho phép.'
    }
  ])

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'reported'>('all')

  // Selected document states for Preview & Delete Modals
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<DocumentItem | null>(null)
  const [activeReportDoc, setActiveReportDoc] = useState<DocumentItem | null>(null)
  const [adminFeedback, setAdminFeedback] = useState('')
  const [deleteReason, setDeleteReason] = useState('')

  useEffect(() => {
    if (!deleteDoc) {
      setDeleteReason('')
    }
  }, [deleteDoc])

  const handleMoveToPending = (id: string, feedback: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, status: 'pending', adminFeedback: feedback } : doc
      )
    )
    // If the active previewed document is moved, update its status too
    if (previewDoc && previewDoc.id === id) {
      setPreviewDoc((prev) => (prev ? { ...prev, status: 'pending', adminFeedback: feedback } : null))
    }
    toast.success(t.admin.toastMovePendingSuccess)
    setActiveReportDoc(null)
  }

  // Filtering logic
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.uploader.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.uploaderEmail.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [documents, searchTerm, statusFilter])

  // Moderate Actions
  const handleApprove = (id: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, status: 'approved' } : doc))
    )
    // If the active previewed document is approved, update it too
    if (previewDoc && previewDoc.id === id) {
      setPreviewDoc((prev) => (prev ? { ...prev, status: 'approved' } : null))
    }
    toast.success(t.admin.toastApproveSuccess)
  }

  const handleDeleteConfirm = () => {
    if (!deleteDoc) return
    setDocuments((prev) => prev.filter((doc) => doc.id !== deleteDoc.id))
    // Close preview if the deleted document was open
    if (previewDoc && previewDoc.id === deleteDoc.id) {
      setPreviewDoc(null)
    }
    
    const msg = language === 'vi'
      ? `Đã xóa tài liệu "${deleteDoc.title}" và gửi phản hồi đến ${deleteDoc.uploaderEmail}: "${deleteReason}"`
      : `Deleted document "${deleteDoc.title}" and sent feedback to ${deleteDoc.uploaderEmail}: "${deleteReason}"`
    toast.success(msg)
    
    setDeleteDoc(null)
    setDeleteReason('')
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
            placeholder={t.admin.searchDocsPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Filters pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(['all', 'pending', 'approved', 'reported'] as const).map((filter) => {
            const getLabel = () => {
              switch (filter) {
                case 'all': return t.common.all || 'All'
                case 'pending': return t.admin.statusPending
                case 'approved': return t.admin.statusApproved
                case 'reported': return t.admin.statusReported
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
                <th className="p-4 pl-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin.docColName}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin.docColType}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin.docColUploader}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin.docColDate}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin.docColSize}</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.admin.docColStatus}</th>
                <th className="p-4 pr-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t.admin.docColActions}</th>
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
                            {t.admin.statusApproved}
                          </Badge>
                        )
                      case 'pending':
                        return (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {t.admin.statusPending}
                          </Badge>
                        )
                      case 'reported':
                        return (
                          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px]">
                            <AlertTriangle className="size-3 text-rose-500" />
                            {t.admin.statusReported}
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
                            {doc.fileName}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-4">
                        <span className="inline-flex items-center justify-center text-[10px] font-extrabold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-md">
                          {doc.type}
                        </span>
                      </td>

                      {/* Uploader */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-350">{doc.uploader}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{doc.uploaderEmail}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-medium text-xs">
                        {doc.uploadedAt}
                      </td>

                      {/* Size */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-medium text-xs">
                        {doc.size}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {getStatusBadge()}
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Report details button if reported */}
                          {doc.status === 'reported' && (
                            <button
                              onClick={() => {
                                setActiveReportDoc(doc)
                                setAdminFeedback(doc.adminFeedback || '')
                              }}
                              className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:text-amber-450 dark:hover:text-amber-400 dark:hover:bg-amber-950/40 transition-all cursor-pointer"
                              title={t.admin.docColReportAction}
                              aria-label={t.admin.docColReportAction}
                            >
                              <AlertOctagon className="size-4.5" />
                            </button>
                          )}

                          {/* Preview button */}
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-all cursor-pointer"
                            title={t.admin.actionPreview}
                            aria-label={t.admin.actionPreview}
                          >
                            <Eye className="size-4.5" />
                          </button>

                          {/* Approve button */}
                          {doc.status !== 'approved' ? (
                            <button
                              onClick={() => handleApprove(doc.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all cursor-pointer"
                              title={t.admin.actionApprove}
                              aria-label={t.admin.actionApprove}
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
                            title={t.admin.actionDelete}
                            aria-label={t.admin.actionDelete}
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
                      <p className="font-extrabold text-sm text-slate-700 dark:text-slate-350">{t.admin.noDocsDocs || "No documents found"}</p>
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">{t.admin.noDocsModeration}</p>
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
        description={previewDoc ? `${t.admin.docColUploader}: ${previewDoc.uploader} (${previewDoc.uploaderEmail})` : undefined}
        className="max-w-3xl"
      >
        {previewDoc && (
          <div className="space-y-6">
            {/* File info bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">{t.admin.docColType}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewDoc.type}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">{t.admin.docColSize}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewDoc.size}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">{t.admin.docColDate}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewDoc.uploadedAt}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">{t.admin.docColStatus}</span>
                <span className="font-bold text-slate-850 dark:text-slate-150">
                  {previewDoc.status === 'approved' && <span className="text-emerald-500 font-extrabold">{t.admin.statusApproved}</span>}
                  {previewDoc.status === 'pending' && <span className="text-amber-500 font-extrabold">{t.admin.statusPending}</span>}
                  {previewDoc.status === 'reported' && <span className="text-rose-500 font-extrabold">{t.admin.statusReported}</span>}
                </span>
              </div>
            </div>

            {/* Description */}
            {previewDoc.description && (
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Description
                </h4>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-350 leading-relaxed">
                  {previewDoc.description}
                </p>
              </div>
            )}

            {/* Simulated Content Screen */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="size-3.5" />
                {t.admin.previewContentTitle}
              </h4>
              <div className="bg-slate-950 text-slate-200 p-6 rounded-2xl font-mono text-xs overflow-x-auto min-h-[180px] max-h-[300px] border border-slate-850 shadow-inner">
                {previewDoc.mockContentLines?.map((line, i) => (
                  <div key={i} className="py-1 border-b border-slate-850 last:border-0 truncate">
                    <span className="text-slate-600 dark:text-slate-550 select-none mr-4">{(i + 1).toString().padStart(2, '0')}</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer actions inside preview */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button
                variant="secondary"
                onClick={() => setPreviewDoc(null)}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {t.common.close || 'Close'}
              </Button>

              <div className="flex items-center gap-2">
                {previewDoc.status !== 'approved' && (
                  <Button
                    onClick={() => {
                      handleApprove(previewDoc.id);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle className="size-3.5" />
                    {t.admin.actionApprove}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setDeleteDoc(previewDoc);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trash2 className="size-3.5" />
                  {t.admin.actionDelete}
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
        title={t.admin.confirmDeleteTitle}
        className="max-w-md"
      >
        {deleteDoc && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl">
              <AlertTriangle className="size-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-sm text-rose-955 dark:text-rose-200 leading-tight">
                  {language === 'vi' ? 'Cảnh báo' : 'Warning'}
                </p>
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-350/80 leading-relaxed">
                  {t.admin.confirmDeleteDesc}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 space-y-1">
              <div className="truncate">
                {language === 'vi' ? 'Tài liệu' : 'Document'}: {deleteDoc.title} ({deleteDoc.fileName})
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {language === 'vi' ? 'Người tải lên' : 'Uploader'}: {deleteDoc.uploader} ({deleteDoc.uploaderEmail})
              </div>
            </div>

            {/* Feedback / Reason for rejection */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {language === 'vi' ? 'Lý do từ chối & Phản hồi (Gửi cho người tải lên)' : 'Reason for rejection & Feedback (Sent to uploader)'}
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={
                  language === 'vi' 
                    ? 'Nhập lý do không duyệt (ví dụ: phát hiện đạo văn 70%, tài liệu có vấn đề...)' 
                    : 'Enter rejection reason (e.g., 70% plagiarism detected, invalid document...)'
                }
                className="w-full h-24 p-3.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-650 font-medium leading-relaxed resize-none transition-all"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                onClick={() => setDeleteDoc(null)}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-355 dark:hover:bg-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {t.common.cancel || 'Cancel'}
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={!deleteReason.trim()}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer shadow-md"
              >
                {t.common.confirm || 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. VIOLATION REPORT DETAILS DIALOG */}
      <Modal
        isOpen={!!activeReportDoc}
        onClose={() => setActiveReportDoc(null)}
        title={t.admin.reportModalTitle}
        className="max-w-xl"
      >
        {activeReportDoc && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs space-y-3.5">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">
                  {t.admin.reporterLabel}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activeReportDoc.reporter || "Anonymous"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-extrabold uppercase block mb-0.5">
                  {t.admin.reportReasonLabel}
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-350 leading-relaxed block">
                  {activeReportDoc.reportReason || "No details provided"}
                </span>
              </div>
            </div>

            {/* Admin feedback field */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-wider block">
                {t.admin.adminFeedbackLabel}
              </label>
              <textarea
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                placeholder="Nhập phản hồi xử lý báo cáo tại đây..."
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
                {t.common.cancel || 'Cancel'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleMoveToPending(activeReportDoc.id, adminFeedback)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {t.admin.actionMovePending}
                </Button>
                <Button
                  onClick={() => {
                    setDeleteDoc(activeReportDoc);
                    setActiveReportDoc(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trash2 className="size-3.5" />
                  {t.admin.actionDelete}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
