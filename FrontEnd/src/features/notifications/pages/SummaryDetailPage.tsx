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
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function SummaryDetailPage() {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)

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
        <QuickActions />
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

function QuickActions() {
  return (
    <div className="mb-6 pt-4 border-t border-[rgba(195,198,215,0.3)]">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#737686] mb-4">
        Quick Actions
      </h3>
      <div className="space-y-3">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-[#3155F6] hover:bg-[#2563eb] text-white py-3 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm focus-visible:outline-none"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-[#E8EEFF] hover:bg-[#D4E5FF] text-[#3155F6] py-3 px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Access</span>
        </button>

        <button
          type="button"
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
