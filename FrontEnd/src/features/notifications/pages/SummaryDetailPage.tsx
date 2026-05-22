import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
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
  Copy,
  Mail,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export function SummaryDetailPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)

  // Share Access Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [permission, setPermission] = useState('Can View')
  const [sharedUsers, setSharedUsers] = useState([
    { email: 'Sarah Jenkins', permission: 'Can View' },
    { email: 'Alex Chen', permission: 'Can Edit' },
  ])
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Delete Document Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

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

  const handleShareAccess = () => {
    setErrorMessage('')
    setSuccessMessage('')
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!shareEmail || !emailRegex.test(shareEmail.trim())) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    const newSharedUser = {
      email: shareEmail.trim(),
      permission: permission,
    }
    setSharedUsers([...sharedUsers, newSharedUser])
    setShareEmail('')
    setSuccessMessage('Access shared successfully.')
    toast.success('Access shared successfully.')
  }

  const handleCopyLink = () => {
    const shareLink = window.location.origin + '/dashboard/notifications/summary'
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        toast.success('Share link copied.')
      })
      .catch(() => {
        const textArea = document.createElement('textarea')
        textArea.value = shareLink
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          toast.success('Share link copied.')
        } catch (err) {
          toast.error('Failed to copy link.')
        }
        document.body.removeChild(textArea)
      })
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
        <button
          type="button"
          onClick={() => navigate('/dashboard/notifications')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#737686] hover:text-[#3155F6] transition-colors cursor-pointer mb-5 focus-visible:outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notifications</span>
        </button>

        {/* Title & Badge Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#0b1c30] leading-tight">
            Advanced Neuroscience Syllabus 2024.pdf
          </h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-[#E8EEFF] px-3.5 py-1 text-xs font-semibold text-[#3155F6]">
              AI Generated Summary
            </span>
            <span className="text-slate-300 select-none text-xs">•</span>
            <span className="text-xs font-medium text-[#737686]">Processed in 1.4s</span>
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
      <div className="w-full lg:w-[320px] shrink-0 border-l border-[rgba(195,198,215,0.3)] pl-0 lg:pl-8 pt-6 lg:pt-0">
        <DocumentInfoPanel />
        <QuickActions
          onDownload={handleDownloadPDF}
          onShare={() => {
            setErrorMessage('')
            setSuccessMessage('')
            setShareEmail('')
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

      <ShareAccessModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        email={shareEmail}
        setEmail={setShareEmail}
        permission={permission}
        setPermission={setPermission}
        sharedUsers={sharedUsers}
        onShare={handleShareAccess}
        onCopyLink={handleCopyLink}
        errorMessage={errorMessage}
        successMessage={successMessage}
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
    <div className="bg-white border-2 border-[#E8EEFF] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#3155F6]" />
        <h2 className="text-lg font-bold text-[#0b1c30]">Quick Overview</h2>
      </div>
      <div className="text-sm leading-relaxed text-[#434655] space-y-4 font-normal">
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
    <div className="bg-white border border-[rgba(195,198,215,0.4)] rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-5">
        <Star className="w-5 h-5 text-[#7C3AED]" />
        <h2 className="text-lg font-bold text-[#0b1c30]">Key Takeaways</h2>
      </div>
      <div className="space-y-5 flex-1">
        {/* Takeaway 1 */}
        <div className="flex gap-3.5 items-start">
          <div className="w-10 h-10 rounded-full bg-[#E8EEFF] flex items-center justify-center text-[#3155F6] shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0b1c30] mb-0.5">
              Synaptic Plasticity Focus
            </h3>
            <p className="text-xs leading-relaxed text-[#434655]">
              Emphasis on LTP and LTD as the primary cellular mechanisms for learning and memory formation in mammals.
            </p>
          </div>
        </div>

        {/* Takeaway 2 */}
        <div className="flex gap-3.5 items-start">
          <div className="w-10 h-10 rounded-full bg-[#E8EEFF] flex items-center justify-center text-[#3155F6] shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0b1c30] mb-0.5">
              Advanced Methodologies
            </h3>
            <p className="text-xs leading-relaxed text-[#434655]">
              Integration of CRISPR/Cas9 imaging and multi-photon techniques.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StudyTopicsCard() {
  const topics = [
    'Neural Circuits',
    'Synaptic Transmission',
    'Dopaminergic Pathways',
    'Cognitive Neuroscience',
  ]

  return (
    <div className="bg-white border border-[rgba(195,198,215,0.4)] rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-5">
        <FileText className="w-5 h-5 text-[#3155F6]" />
        <h2 className="text-lg font-bold text-[#0b1c30]">Study Topics</h2>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {topics.map((topic) => (
          <div
            key={topic}
            className="w-full bg-[#F4F7FE] border border-[rgba(195,198,215,0.4)] rounded-xl py-3 px-4 text-sm font-semibold text-[#434655] hover:text-[#3155F6] hover:bg-[#E8EEFF]/60 hover:border-[#3155F6]/20 transition-all cursor-pointer"
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
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#737686] mb-4">
        Document Info
      </h3>

      {/* Beautiful Document Preview Box */}
      <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#0b1c30] to-[#1e3a8a] p-4 flex items-center justify-center shadow-md overflow-hidden mb-6">
        {/* Mock PDF Document Page */}
        <div className="bg-white w-[130px] h-[170px] rounded shadow-xl p-3 flex flex-col justify-between select-none relative rotate-1 hover:rotate-0 transition-transform duration-300">
          <div>
            <div className="text-[7px] font-extrabold text-[#0b1c30] uppercase tracking-wider border-b pb-1 mb-2">
              Neuroscience
            </div>
            {/* Micro Lines */}
            <div className="space-y-1">
              <div className="h-1 bg-slate-200 rounded w-full" />
              <div className="h-1 bg-slate-200 rounded w-11/12" />
              <div className="h-1 bg-slate-100 rounded w-4/5" />
            </div>
            {/* Synapse Wiring SVG */}
            <div className="mt-3 flex justify-center">
              <svg className="w-16 h-12 text-[#3155F6]" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <div className="text-[6px] text-slate-300 text-center font-medium">
            Page 1 of 24
          </div>
        </div>
      </div>

      {/* Info Details */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#737686] font-medium">File Size</span>
          <span className="text-[#0b1c30] font-bold">1.2 MB</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#737686] font-medium">Uploaded</span>
          <span className="text-[#0b1c30] font-bold">Oct 12, 2024</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#737686] font-medium">Pages</span>
          <span className="text-[#0b1c30] font-bold">24</span>
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
    <div className="mb-6 pt-4 border-t border-[rgba(195,198,215,0.3)]">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#737686] mb-4">
        Quick Actions
      </h3>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onDownload}
          className="w-full flex items-center justify-center gap-2 bg-[#3155F6] hover:bg-[#2563eb] text-white py-3 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm focus-visible:outline-none"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>

        <button
          type="button"
          onClick={onShare}
          className="w-full flex items-center justify-center gap-2 bg-[#E8EEFF] hover:bg-[#D4E5FF] text-[#3155F6] py-3 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Access</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 bg-white border border-[rgba(195,198,215,0.5)] hover:bg-red-50 hover:border-red-200 text-[#EF4444] py-3 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none"
        >
          <Trash2 className="w-4 h-4 text-[#EF4444]" />
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
    <div className="bg-[#F4F7FE] border border-[#E8EEFF] rounded-2xl p-5">
      <h4 className="text-sm font-bold text-[#0b1c30] mb-1">
        Did this help?
      </h4>
      <p className="text-xs text-[#737686] mb-4 leading-normal font-normal">
        Your feedback improves our AI summarization engine.
      </p>
      <div className="flex gap-2.5 justify-center">
        <button
          type="button"
          onClick={onLike}
          className={cn(
            "w-full flex items-center justify-center py-2 px-4 rounded-xl border transition-all cursor-pointer bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus-visible:outline-none",
            liked
              ? "border-[#3155F6] bg-blue-50 text-[#3155F6]"
              : "border-[rgba(195,198,215,0.4)] text-[#737686] hover:bg-slate-50"
          )}
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDislike}
          className={cn(
            "w-full flex items-center justify-center py-2 px-4 rounded-xl border transition-all cursor-pointer bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus-visible:outline-none",
            disliked
              ? "border-red-500 bg-red-50 text-red-500"
              : "border-[rgba(195,198,215,0.4)] text-[#737686] hover:bg-slate-50"
          )}
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface ShareAccessModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  setEmail: (val: string) => void
  permission: string
  setPermission: (val: string) => void
  sharedUsers: Array<{ email: string; permission: string }>
  onShare: () => void
  onCopyLink: () => void
  errorMessage?: string
  successMessage?: string
}

function ShareAccessModal({
  isOpen,
  onClose,
  email,
  setEmail,
  permission,
  setPermission,
  sharedUsers,
  onShare,
  onCopyLink,
  errorMessage,
  successMessage,
}: ShareAccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="bg-white rounded-2xl border border-[rgba(195,198,215,0.4)] shadow-2xl p-6 w-full max-w-[440px] relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button X */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#737686] hover:text-[#0b1c30] p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5 pr-8">
          <h3 className="text-xl font-bold text-[#0b1c30] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#3155F6]" />
            <span>Share Access</span>
          </h3>
          <p className="text-xs text-[#737686] mt-1 font-normal leading-normal">
            Invite people to view or collaborate on this document.
          </p>
        </div>

        {/* Email Input & Permission Select Row */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-[#737686] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737686]">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[rgba(195,198,215,0.5)] focus:border-[#3155F6] text-sm text-[#0b1c30] placeholder-slate-400 bg-white transition-all focus:ring-1 focus:ring-[#3155F6] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#737686] uppercase tracking-wider mb-2">
              Choose Permission
            </label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[rgba(195,198,215,0.5)] focus:border-[#3155F6] text-sm text-[#0b1c30] bg-white transition-all focus:outline-none cursor-pointer"
            >
              <option value="Can View">Can View</option>
              <option value="Can Comment">Can Comment</option>
              <option value="Can Edit">Can Edit</option>
            </select>
          </div>
        </div>

        {/* Errors & Success Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Shared Users List */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-[#737686] uppercase tracking-wider mb-3">
            Shared Users
          </h4>
          <div className="max-h-[120px] overflow-y-auto space-y-2.5 pr-1 border border-[rgba(195,198,215,0.2)] rounded-xl p-3 bg-slate-50">
            {sharedUsers.map((user, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#0b1c30] truncate max-w-[240px]">
                  {user.email}
                </span>
                <span className="text-[#3155F6] font-bold bg-[#E8EEFF] px-2.5 py-1 rounded-full text-[10px] uppercase">
                  {user.permission}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border border-[rgba(195,198,215,0.6)] text-[#737686] py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onShare}
              className="flex-1 bg-[#3155F6] text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-[#2563eb] active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-none"
            >
              Share
            </button>
          </div>

          <button
            type="button"
            onClick={onCopyLink}
            className="w-full flex items-center justify-center gap-1.5 border border-dashed border-[#3155F6] hover:bg-[#E8EEFF]/40 text-[#3155F6] py-2.5 px-4 rounded-xl text-xs font-bold active:scale-[0.99] transition-all duration-150 cursor-pointer focus-visible:outline-none"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy share link</span>
          </button>
        </div>
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
      <div className="bg-white rounded-2xl border border-[rgba(195,198,215,0.4)] shadow-2xl p-6 w-full max-w-[400px] relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button X */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#737686] hover:text-[#0b1c30] p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-[#0b1c30]">Delete Document?</h3>
        </div>

        <p className="text-sm text-[#737686] leading-relaxed mb-6 font-normal">
          Are you sure you want to delete <span className="font-semibold text-[#0b1c30]">Advanced Neuroscience Syllabus 2024.pdf</span>? This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white border border-[rgba(195,198,215,0.6)] text-[#737686] py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-none"
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

