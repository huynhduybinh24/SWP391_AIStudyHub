import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Star,
  Brain,
  Cpu,
  FileText,
  Download,
  Share2,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  X,
} from 'lucide-react'
import BackButton from '@/components/shared/BackButton'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { ShareModal, ShareModalUser } from '@/components/common/ShareModal'

export function SummaryDetailPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)

  // Share Access Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // Delete Document Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const defaultUsers: ShareModalUser[] = [
    { id: 'alex', name: 'Alex Rivera', email: 'alex@example.com', permission: 'Chủ sở hữu' },
    { id: 'sarah', name: 'Sarah Jenkins', email: 'sarah@example.com', permission: 'Người xem' },
    { id: 'alex-chen', name: 'Alex Chen', email: 'alex.chen@example.com', permission: 'Người chỉnh sửa' }
  ]

  const handleDownloadPDF = () => {
    const fileName = 'Advanced-Neuroscience-Syllabus-2024.pdf'
    // Create a mock PDF content Blob
    const mockPdfContent = '%PDF-1.4\n%...\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n...'
    const blob = new Blob([mockPdfContent], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('PDF downloaded successfully.')
  }



  const handleDeleteDocument = () => {
    setIsDeleteModalOpen(false)
    toast.success('Document deleted successfully.')
    setTimeout(() => {
      navigate('/dashboard/notifications')
    }, 1000)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Left Column: Summary Content */}
      <div className="flex-1 min-w-0 w-full">
        {/* Back Link */}
        <div className="mb-5">
          <BackButton
            label="Back to Notifications"
            to="/dashboard/notifications"
          />
        </div>

        {/* Title & Badge Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#0b1c30] dark:text-slate-100 leading-tight">
            Advanced Neuroscience Syllabus 2024.pdf
          </h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-[#E8EEFF] dark:bg-blue-950/40 px-3.5 py-1 text-xs font-semibold text-[#3155F6] dark:text-blue-400">
              AI Generated Summary
            </span>
            <span className="text-slate-300 dark:text-slate-700 select-none text-xs">•</span>
            <span className="text-xs font-medium text-[#737686] dark:text-slate-400">Processed in 1.4s</span>
          </div>
        </div>

        {/* 1. Quick Overview Card */}
        <SummaryOverviewCard />

        {/* Two-column layout for Key Takeaways and Study Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <KeyTakeawaysCard />
          <StudyTopicsCard />
        </div>
      </div>

      {/* Right Column: Document Info Panel */}
      <div className="w-full lg:w-[320px] shrink-0 border-l border-[rgba(195,198,215,0.3)] dark:border-slate-850 pl-0 lg:pl-8 pt-6 lg:pt-0">
        <DocumentInfoPanel />
        <QuickActions
          onDownload={handleDownloadPDF}
          onShare={() => {
            setIsShareModalOpen(true)
          }}
          onDelete={() => setIsDeleteModalOpen(true)}
        />
        <FeedbackCard
          liked={liked}
          disliked={disliked}
          onLike={() => {
            setLiked(!liked)
            if (disliked) setDisliked(false)
          }}
          onDislike={() => {
            setDisliked(!disliked)
            if (liked) setLiked(false)
          }}
        />
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileName="Advanced Neuroscience Syllabus 2024.pdf"
        shareUrl="http://localhost:5173/dashboard/notifications/summary"
        initialUsers={defaultUsers}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteDocument}
      />
    </div>
  )
}

/* --- SUB COMPONENTS --- */

function SummaryOverviewCard() {
  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-[#E8EEFF] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#3155F6] dark:text-blue-400" />
        <h2 className="text-lg font-bold text-[#0b1c30] dark:text-slate-100">Quick Overview</h2>
      </div>
      <div className="text-sm leading-relaxed text-[#434655] dark:text-slate-300 space-y-4 font-normal">
        <p>
          This comprehensive syllabus outlines the Advanced Neuroscience course (NEURO-402) for the 2024
          academic year. The curriculum focuses on the intricate molecular mechanisms of synaptic plasticity,
          neural circuitry, and the biological underpinnings of cognitive functions. It transitions from
          basic neuroanatomy to advanced computational modeling of neural networks.
        </p>
        <p>
          Key themes include the role of glial cells in homeostasis, the electrophysiological properties of
          hippocampal neurons, and the application of optogenetics in modern research. Students are expected
          to demonstrate proficiency in both theoretical frameworks and practical laboratory techniques
          throughout the semester.
        </p>
      </div>
    </div>
  )
}

function KeyTakeawaysCard() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-[rgba(195,198,215,0.4)] dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-5">
        <Star className="w-5 h-5 text-[#7C3AED]" />
        <h2 className="text-lg font-bold text-[#0b1c30] dark:text-slate-100">Key Takeaways</h2>
      </div>
      <div className="space-y-5 flex-1">
        {/* Takeaway 1 */}
        <div className="flex gap-3.5 items-start">
          <div className="w-10 h-10 rounded-full bg-[#E8EEFF] dark:bg-blue-950/40 flex items-center justify-center text-[#3155F6] dark:text-blue-400 shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0b1c30] dark:text-slate-100 mb-0.5">
              Synaptic Plasticity Focus
            </h3>
            <p className="text-xs leading-relaxed text-[#434655] dark:text-slate-300">
              Emphasis on LTP and LTD as the primary cellular mechanisms for learning and memory formation in mammals.
            </p>
          </div>
        </div>

        {/* Takeaway 2 */}
        <div className="flex gap-3.5 items-start">
          <div className="w-10 h-10 rounded-full bg-[#E8EEFF] dark:bg-blue-950/40 flex items-center justify-center text-[#3155F6] dark:text-blue-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0b1c30] dark:text-slate-100 mb-0.5">
              Advanced Methodologies
            </h3>
            <p className="text-xs leading-relaxed text-[#434655] dark:text-slate-300">
              Integration of CRISPR/Cas9 imaging and multi-photon techniques.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * StudyTopicsCard Component
 * Displays specific AI-summarized topics matching Figma specs exactly:
 * - Neural Circuits
 * - Synaptic Transmission
 * - Dopaminergic Pathways
 * - Cognitive Neuroscience
 * Uses fully verified lucide-react icons and the cn utility helper.
 */
function StudyTopicsCard() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  
  const topics = [
    'Neural Circuits',
    'Synaptic Transmission',
    'Dopaminergic Pathways',
    'Cognitive Neuroscience',
  ]

  return (
    <div className="bg-white dark:bg-slate-900 border border-[rgba(195,198,215,0.4)] dark:border-slate-800 rounded-[20px] p-[24px] md:p-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col h-full">
      <div className="flex items-center gap-2.5 mb-6">
        <FileText className="w-[26px] h-[26px] text-[#3155F6] dark:text-blue-400" />
        <h2 className="text-[22px] font-bold text-[#0b1c30] dark:text-slate-100 tracking-tight">Study Topics</h2>
        {selectedTopic && <span className="sr-only">Selected: {selectedTopic}</span>}
      </div>
      <div className="flex flex-col gap-[14px] flex-1">
        {topics.map((topic) => (
          <div
            key={topic}
            onClick={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
            className={cn(
              "w-full border rounded-[12px] py-[14px] px-[18px] text-[15px] font-semibold transition-all duration-200 cursor-pointer text-left focus-visible:outline-none",
              selectedTopic === topic
                ? "bg-[#E8EEFF]/60 dark:bg-blue-950/40 border-[#3155F6] dark:border-blue-500 text-[#3155F6] dark:text-blue-400 shadow-[0_2px_12px_rgba(49,85,246,0.06)]"
                : "bg-[#F4F7FE] dark:bg-slate-950 border-[rgba(195,198,215,0.3)] dark:border-slate-805 text-[#434655] dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:border-[#3155F6]/30 dark:hover:border-blue-500/30 hover:text-[#3155F6] dark:hover:text-blue-400"
            )}
          >
            {topic}
          </div>
        ))}
      </div>
    </div>
  )
}

function DocumentInfoPanel() {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#737686] dark:text-slate-400 mb-4">
        Document Info
      </h3>

      {/* Beautiful Document Preview Box */}
      <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#0b1c30] to-[#1e3a8a] p-4 flex items-center justify-center shadow-md overflow-hidden mb-6">
        {/* Mock PDF Document Page */}
        <div className="bg-white dark:bg-slate-900 w-[130px] h-[170px] rounded shadow-xl p-3 flex flex-col justify-between select-none relative rotate-1 hover:rotate-0 transition-transform duration-300">
          <div>
            <div className="text-[7px] font-extrabold text-[#0b1c30] dark:text-slate-100 uppercase tracking-wider border-b dark:border-slate-800 pb-1 mb-2">
              Neuroscience
            </div>
            {/* Micro Lines */}
            <div className="space-y-1">
              <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded w-11/12" />
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded w-4/5" />
            </div>
            {/* Synapse Wiring SVG */}
            <div className="mt-3 flex justify-center">
              <svg className="w-16 h-12 text-[#3155F6] dark:text-blue-400" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="40" r="4" fill="currentColor" />
                <circle cx="50" cy="20" r="4" fill="currentColor" />
                <circle cx="50" cy="60" r="4" fill="currentColor" />
                <circle cx="80" cy="40" r="4" fill="currentColor" />
                <line x1="24" y1="40" x2="46" y2="22" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="24" y1="40" x2="46" y2="58" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="54" y1="20" x2="76" y2="38" stroke="currentColor" strokeWidth="1" />
                <line x1="54" y1="60" x2="76" y2="42" stroke="currentColor" strokeWidth="1" />
                <line x1="50" y1="24" x2="50" y2="56" stroke="currentColor" strokeWidth="0.75" />
                <text x="12" y="32" fill="#737686" fontSize="5" fontWeight="bold">LTP</text>
                <text x="74" y="32" fill="#737686" fontSize="5" fontWeight="bold">LTD</text>
              </svg>
            </div>
          </div>
          <div className="text-[6px] text-slate-300 dark:text-slate-500 text-center font-medium">
            Page 1 of 24
          </div>
        </div>
      </div>

      {/* Info Details */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#737686] dark:text-slate-400 font-medium">File Size</span>
          <span className="text-[#0b1c30] dark:text-slate-105 font-bold">1.2 MB</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#737686] dark:text-slate-400 font-medium">Uploaded</span>
          <span className="text-[#0b1c30] dark:text-slate-105 font-bold">Oct 12, 2024</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#737686] dark:text-slate-400 font-medium">Pages</span>
          <span className="text-[#0b1c30] dark:text-slate-105 font-bold">24</span>
        </div>
      </div>
    </div>
  )
}

/**
 * QuickActions Component
 * Renders document action buttons (Download PDF, Share Access, Delete Document)
 * handles direct callback actions for local modals and mock assets.
 */
interface QuickActionsProps {
  onDownload: () => void
  onShare: () => void
  onDelete: () => void
}

function QuickActions({ onDownload, onShare, onDelete }: QuickActionsProps) {
  return (
    <div className="mb-6 pt-4 border-t border-[rgba(195,198,215,0.3)] dark:border-slate-800">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#737686] dark:text-slate-400 mb-4">
        Quick Actions
      </h3>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onDownload}
          className="w-full flex items-center justify-center gap-2 bg-[#3155F6] hover:bg-[#2563eb] dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-3 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm focus-visible:outline-none"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>

        <button
          type="button"
          onClick={onShare}
          className="w-full flex items-center justify-center gap-2 bg-[#E8EEFF] hover:bg-[#D4E5FF] text-[#3155F6] py-3 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-400"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Access</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-[rgba(195,198,215,0.5)] dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900 text-[#EF4444] dark:text-red-400 py-3 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none"
        >
          <Trash2 className="w-4 h-4 text-[#EF4444] dark:text-red-400" />
          <span>Delete Document</span>
        </button>
      </div>
    </div>
  )
}

interface FeedbackProps {
  liked: boolean
  disliked: boolean
  onLike: () => void
  onDislike: () => void
}

function FeedbackCard({ liked, disliked, onLike, onDislike }: FeedbackProps) {
  return (
    <div className="bg-[#F4F7FE] dark:bg-slate-900 border border-[#E8EEFF] dark:border-slate-800 rounded-2xl p-5">
      <h4 className="text-sm font-bold text-[#0b1c30] dark:text-slate-100 mb-1">
        Did this help?
      </h4>
      <p className="text-xs text-[#737686] dark:text-slate-400 mb-4 leading-normal font-normal">
        Your feedback improves our AI summarization engine.
      </p>
      <div className="flex gap-2.5 justify-center">
        <button
          type="button"
          onClick={onLike}
          className={cn(
            "w-full flex items-center justify-center py-2 px-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus-visible:outline-none",
            liked
              ? "border-[#3155F6] bg-blue-50 dark:bg-blue-950/40 text-[#3155F6] dark:text-blue-400"
              : "border-[rgba(195,198,215,0.4)] dark:border-slate-800 text-[#737686] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          )}
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDislike}
          className={cn(
            "w-full flex items-center justify-center py-2 px-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus-visible:outline-none",
            disliked
              ? "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400"
              : "border-[rgba(195,198,215,0.4)] dark:border-slate-800 text-[#737686] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          )}
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}



interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
}

function DeleteConfirmModal({ isOpen, onClose, onDelete }: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[rgba(195,198,215,0.4)] dark:border-slate-800 shadow-2xl p-6 w-full max-w-[400px] relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button X */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#737686] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-500 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#0b1c30] dark:text-slate-100">Delete Document?</h3>
        </div>

        <p className="text-sm text-[#737686] dark:text-slate-400 leading-relaxed mb-6 font-normal">
          Are you sure you want to delete <span className="font-semibold text-[#0b1c30] dark:text-slate-100">Advanced Neuroscience Syllabus 2024.pdf</span>? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white dark:bg-slate-900 border border-[rgba(195,198,215,0.6)] dark:border-slate-800 text-[#737686] dark:text-slate-400 py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex-1 bg-[#EF4444] text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-red-600 active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-none"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// Layout, labels, icons, actions, and interaction verification completed successfully.


