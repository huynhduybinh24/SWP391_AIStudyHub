import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Download,
  ShieldCheck,
  Check,
  ChevronDown,
  Calendar,
  BookOpen,
  FileText,
  Sparkles,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface DocumentItem {
  id: string
  title: string
  fileName: string
  uploadedAt: string
  uploadedDateObj: Date
  size: string
  sizeKb: number
  subject: 'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL' | 'NEUROSCIENCE' | 'PSYCHOLOGY'
  status: 'ANALYZED' | 'PENDING' | 'SCANNING' | 'QUEUED'
  type: 'pdf' | 'word' | 'image' | 'text' | 'slides'
}

interface DocumentsContextType {
  documents: DocumentItem[]
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>
  openUploadModal: () => void
  openChatDrawer: (doc: DocumentItem) => void
  openPreviewModal: (doc: DocumentItem) => void
  openQuizModal: () => void
  showToast: (message: string) => void
  handleDownloadFile: (doc: DocumentItem) => void
  handleDeleteDocument: (id: string) => void
  renderFileIcon: (type: string) => React.ReactNode
  renderStatusBadge: (status: string) => React.ReactNode
}

const SUBJECT_DETAILS_MOCK: Record<
  string,
  {
    courseTitle: string
    courseCode: string
    overview: string
    objectives: string[]
    tags: string[]
    description: string
    pagesCount: number
  }
> = {
  NEUROSCIENCE: {
    courseTitle: 'Advanced Neuroscience',
    courseCode: 'NEURO-402 Syllabus 2024',
    overview:
      'This course explores the complex dynamics of neural networks and the molecular basis of synaptic plasticity. We examine how individual neuronal activities integrate into large-scale functional networks, utilizing advanced neuroimaging techniques to map the cognitive architecture of the human brain.',
    objectives: [
      'Understand functional connectivity in the human brain.',
      'Analyze fMRI data for resting-state networks.',
      'Explore molecular mechanisms of memory consolidation.'
    ],
    tags: ['#Neuro', '#2024', '#Syllabus'],
    description:
      'Comprehensive curriculum overview for the Fall 2024 semester, including weekly reading lists, lab schedules, and grading rubrics for NEURO-402.',
    pagesCount: 42
  },
  COMPSCI: {
    courseTitle: 'Advanced Software Engineering',
    courseCode: 'CS-402 Study Guide 2024',
    overview:
      'Deep dive into modern microservice architectures, enterprise design patterns, and cloud-native scaling strategies. This guide details how to build highly decoupled systems using event-driven telemetry and distributed caching models.',
    objectives: [
      'Implement thread-safe design patterns in high-concurrency environments.',
      'Design distributed pub/sub pipelines with automated failover handling.',
      'Optimize database indexing strategies and memory caching layers.'
    ],
    tags: ['#SoftwareEng', '#DesignPatterns', '#Microservices'],
    description:
      'Comprehensive syllabus overview detailing software engineering models, design pattern catalogs, weekly coding exercises, and grading policies.',
    pagesCount: 28
  },
  MATHEMATICS: {
    courseTitle: 'Multivariable Calculus & Linear Algebra',
    courseCode: 'MATH-202 Reference Sheet',
    overview:
      'A compact guide covering fundamental mathematical derivations in multivariable space, gradient descent vector mechanics, and matrix decomposition theorems used extensively inside neural network backpropagation models.',
    objectives: [
      'Formulate Taylor expansions in multivariable dimensions.',
      'Deconstruct high-dimensional matrices using Singular Value Decomposition.',
      'Compute vector gradients and Jacobians for complex cost functions.'
    ],
    tags: ['#Calculus', '#MathSheet', '#LinearAlgebra'],
    description:
      'High-fidelity quick reference sheet for complex multivariable equations, gradient computations, and matrix transformation rules.',
    pagesCount: 15
  },
  BIOLOGY: {
    courseTitle: 'Molecular Genetics & Cell Biology',
    courseCode: 'BIO-305 Lab Companion',
    overview:
      'Detailed overview of intracellular signaling pathways, CRISPR-Cas9 genetic editing mechanics, and mitochondrial DNA transcription processes in active eukaryotic organisms.',
    objectives: [
      'Trace chemical cascade dynamics inside ribosomal cell complexes.',
      'Diagram the double-helix replication loop with enzymatic boundaries.',
      'Evaluate evolutionary genetics in cellular metabolic cycles.'
    ],
    tags: ['#Genetics', '#CellBio', '#LabNotes'],
    description:
      'Laboratory notebook and synthesis manual outlining modern CRISPR gene modification systems, cellular signaling cascades, and transcription rules.',
    pagesCount: 34
  },
  PHYSICS: {
    courseTitle: 'Quantum Mechanics & Wave Theory',
    courseCode: 'PHY-301 Core Formulation',
    overview:
      'Exploring the mathematical formulations of wave-particle duality, potential barrier tunneling probabilities, and structural applications of the time-independent Schrödinger Equation.',
    objectives: [
      'Apply Planck constant scaling in De Broglie equations.',
      'Solve potential energy barrier states for tunneling values.',
      'Analyze spin mechanics and quantum entanglement models.'
    ],
    tags: ['#Quantum', '#WaveTheory', '#Formulas'],
    description:
      'Study notes outlining foundational quantum mechanical principles, wave equations, and photoelectric effect experiments.',
    pagesCount: 20
  },
  GENERAL: {
    courseTitle: 'Integrated Academic Study Methods',
    courseCode: 'GEN-101 Course Companion',
    overview:
      'A practical manual summarizing cognitive science techniques to maximize student recall, including detailed instructions for active recall routines, spaced repetition timers, and the Feynman technique.',
    objectives: [
      'Build active recall routines for conceptual examinations.',
      'Optimize long-term recall rates using spaced retention intervals.',
      'Simplify complex academic papers through systematic deconstruction.'
    ],
    tags: ['#StudySkills', '#RecallMethod', '#AIAssistant'],
    description:
      'Detailed cognitive study handbook outlining modern spacing algorithms, self-testing strategies, and structural planning systems.',
    pagesCount: 12
  }
}

export default function DownloadDocumentPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()

  const {
    documents,
    showToast,
    handleDownloadFile
  } = useOutletContext<DocumentsContextType>()

  // 1. Resolve active document or mock fallback
  const activeDoc = documents.find(d => d.id === documentId)
  const subjectKey = (activeDoc?.subject || 'NEUROSCIENCE').toUpperCase()
  const mockDetails = SUBJECT_DETAILS_MOCK[subjectKey] || SUBJECT_DETAILS_MOCK.NEUROSCIENCE

  const docTitle = activeDoc?.title || mockDetails.courseTitle
  const docFileName = activeDoc?.fileName || `${mockDetails.courseTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`
  const docSize = activeDoc?.size || '1.2 MB'
  const docPages = mockDetails.pagesCount
  const docUploaded = activeDoc?.uploadedAt ? activeDoc.uploadedAt.replace('Uploaded ', '') : 'Oct 12, 2024'

  // 2. States for active downloads
  const [downloadFormat, setDownloadFormat] = useState<'ZIP' | 'PDF'>('ZIP')
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false)
  const formatDropdownRef = useRef<HTMLDivElement>(null)

  const [activeDownloadType, setActiveDownloadType] = useState<'original' | 'summary' | 'notes' | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadSpeedText, setDownloadSpeedText] = useState('')

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
        setIsFormatDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Simulated download progress loop
  useEffect(() => {
    if (!activeDownloadType) return

    setDownloadProgress(0)
    
    // speed telemetry helpers
    const totalSizeMb = activeDownloadType === 'original' ? 1.2 : activeDownloadType === 'summary' ? 0.3 : 2.5
    const intervalTime = 80
    const stepsCount = 50
    const stepIncrement = 100 / stepsCount
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const nextProgress = Math.min(Math.round(currentStep * stepIncrement), 100)
      setDownloadProgress(nextProgress)
      
      const currentDownloaded = ((nextProgress / 100) * totalSizeMb).toFixed(1)
      setDownloadSpeedText(`Downloading... ${currentDownloaded} / ${totalSizeMb} MB`)

      if (currentStep >= stepsCount) {
        clearInterval(timer)
        setTimeout(() => {
          showToast(`⚡ Tải tài liệu thành công! Đã lưu tệp ${getFileName(activeDownloadType)}`)
          setActiveDownloadType(null)
        }, 300)
      }
    }, intervalTime)

    return () => clearInterval(timer)
  }, [activeDownloadType])

  const getFileName = (type: 'original' | 'summary' | 'notes') => {
    const baseName = docFileName.replace(/\.[^/.]+$/, '')
    if (type === 'original') return `${baseName}.pdf`
    if (type === 'summary') return `${baseName}_AI_Summary.pdf`
    return `${baseName}_Notes_Package.${downloadFormat.toLowerCase()}`
  }

  const triggerSimulatedDownload = (type: 'original' | 'summary' | 'notes') => {
    if (activeDownloadType) {
      showToast('⚠️ Hiện đang có một tiến trình tải xuống đang chạy!')
      return
    }
    setActiveDownloadType(type)
    showToast(`🤖 Đang khởi tạo tệp tải xuống dạng: ${type.toUpperCase()}...`)
  }

  const handleCancelDownload = () => {
    setActiveDownloadType(null)
    setDownloadProgress(0)
    showToast('❌ Đã hủy tải xuống tài liệu.')
  }

  return (
    <div className="space-y-7 relative">
      {/* Top Breadcrumb Navigation */}
      <div className="flex select-none">
        <button
          onClick={() => navigate(`/dashboard/documents/document/${documentId || 'neuroscience'}`)}
          className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-1" />
          <span>Back to Document</span>
        </button>
      </div>

      {/* Main Page Title Header */}
      <div className="text-left space-y-1.5 pt-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none dark:text-white">
          Download Document
        </h1>
        <p className="text-sm font-semibold text-slate-400">
          Review file details and choose your download option.
        </p>
      </div>

      {/* Grid Layout structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        
        {/* LEFT COLUMN: Document Detail Card */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-md space-y-6 flex flex-col text-left">
            
            {/* Themed Document Brain Cover Image */}
            <div className="border border-slate-200/85 rounded-2xl overflow-hidden shadow-inner bg-slate-950 p-2.5 relative group min-h-[190px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none opacity-60 transition-opacity group-hover:opacity-85" />
              
              {/* PDF Badge */}
              <div className="absolute top-4 left-4 bg-rose-600/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider select-none shadow-md">
                <FileText className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>PDF</span>
              </div>

              <img
                src="/glowing_blue_brain.png"
                alt="Glowing Brain Neural Network"
                className="w-full h-auto object-cover rounded-xl select-none"
              />
            </div>

            {/* Document Title & Shared Badge Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-slate-900 leading-snug tracking-tight">
                  {docTitle}
                </h2>
              </div>
              
              {/* Shared badge pill */}
              <div className="flex">
                <span className="flex items-center gap-1.5 text-[10px] tracking-wide font-black uppercase bg-blue-50 border border-blue-100 text-blue-600 px-3.5 py-1.5 rounded-full shadow-sm select-none">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Shared
                </span>
              </div>
            </div>

            {/* Telemetry specs Grid */}
            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-400">
                  <Download className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider">File Size</span>
                </div>
                <p className="text-sm font-bold text-slate-700 select-all">
                  {docSize}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-400">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Length</span>
                </div>
                <p className="text-sm font-bold text-slate-700 select-none">
                  {docPages} pages
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Uploaded</span>
                </div>
                <p className="text-sm font-bold text-slate-700 select-none truncate">
                  {docUploaded}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Choose Download Option Card */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-md space-y-6 flex flex-col text-left relative overflow-visible">
            
            {/* Soft blue top border glow highlight */}
            <div className="absolute top-0 left-6 right-6 h-[4px] bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-500 rounded-b-full opacity-90" />

            {/* Alert Access Block */}
            <div className="bg-blue-50/70 border border-blue-100/60 p-4 rounded-2xl flex items-center gap-3.5 animate-fade-in select-none">
              <div className="bg-blue-500/10 text-blue-600 p-2 rounded-xl flex items-center justify-center shrink-0 border border-blue-100/50 shadow-inner">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-blue-800 leading-normal">
                Your access level allows downloading this document.
              </span>
            </div>

            {/* Options List wrapper */}
            <div className="space-y-4">
              
              {/* Option 1: Download Original PDF */}
              <div className="border border-slate-200/70 hover:border-blue-200 hover:bg-slate-50/30 transition-all p-4.5 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1 text-left min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 leading-snug">
                    Download Original File
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed truncate">
                    The complete, unaltered document.
                  </p>
                </div>
                <Button
                  onClick={() => triggerSimulatedDownload('original')}
                  disabled={!!activeDownloadType}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl flex items-center gap-1.5 shadow-md active:scale-97 transition-all shrink-0 disabled:opacity-50"
                >
                  <span>Download PDF</span>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Option 2: Download AI Summary */}
              <div className="border border-slate-200/70 hover:border-blue-200 hover:bg-slate-50/30 transition-all p-4.5 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800 leading-none">
                      Download AI Summary
                    </h4>
                    <span className="bg-[#0fbf7c] text-white text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider select-none shadow-xs border border-teal-500/10">
                      PRO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed truncate mt-1">
                    A concise, 3-page intelligent overview.
                  </p>
                </div>
                <Button
                  onClick={() => triggerSimulatedDownload('summary')}
                  disabled={!!activeDownloadType}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs px-5 py-3 rounded-2xl flex items-center gap-1.5 shadow-sm active:scale-97 transition-all shrink-0 disabled:opacity-50"
                >
                  <span>Download Summary</span>
                </Button>
              </div>

              {/* Option 3: Download Notes Package (ZIP/PDF) */}
              <div className="border border-slate-200/70 hover:border-blue-200 hover:bg-slate-50/30 transition-all p-4.5 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1 text-left min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 leading-snug">
                      Download Notes Package
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed truncate">
                      Includes source file, summary, and flashcards.
                    </p>
                  </div>
                  <Button
                    onClick={() => triggerSimulatedDownload('notes')}
                    disabled={!!activeDownloadType}
                    className="bg-[#f8fafc] border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs px-5 py-3 rounded-2xl flex items-center gap-1.5 shadow-sm active:scale-97 transition-all shrink-0 disabled:opacity-50"
                  >
                    <span>Download Package</span>
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                  </Button>
                </div>
                
                {/* Format Dropdown Option inside package */}
                <div className="relative inline-block text-left" ref={formatDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 transition-colors select-none shadow-xs"
                  >
                    <span>Format: {downloadFormat}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </button>

                  {isFormatDropdownOpen && (
                    <div className="absolute left-0 mt-1 bg-white border border-slate-200 shadow-lg rounded-xl z-20 py-1 w-32 animate-fade-in text-left">
                      {(['ZIP', 'PDF'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => {
                            setDownloadFormat(fmt)
                            setIsFormatDropdownOpen(false)
                            showToast(`✏️ Thay đổi định dạng xuất gói ghi chú thành: ${fmt}`)
                          }}
                          className={cn(
                            "w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between transition-colors",
                            downloadFormat === fmt ? "text-blue-600 bg-blue-50/40" : "text-slate-700"
                          )}
                        >
                          <span>{fmt}</span>
                          {downloadFormat === fmt && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Floating Bottom-Right Download Progress Notification Banner */}
      <AnimatePresence>
        {activeDownloadType && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-white border border-slate-250/90 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 font-sans select-none text-left"
          >
            {/* Header description info */}
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-slate-900 truncate leading-snug" title={getFileName(activeDownloadType)}>
                  {getFileName(activeDownloadType)}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5 text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-spin shrink-0" />
                  <span className="text-[10px] font-semibold italic text-blue-500 truncate leading-relaxed">
                    Analyzing nodes & packaging assets...
                  </span>
                </div>
              </div>
              <span className="text-xs font-black text-slate-700 shrink-0 ml-3">
                {downloadProgress}%
              </span>
            </div>

            {/* Slider track bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-100 shadow-md"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>

            {/* Footer speed description or Cancel button */}
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
              <span className="truncate max-w-[200px]">
                {downloadSpeedText}
              </span>
              <button
                type="button"
                onClick={handleCancelDownload}
                className="text-rose-600 hover:text-rose-700 font-extrabold cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
