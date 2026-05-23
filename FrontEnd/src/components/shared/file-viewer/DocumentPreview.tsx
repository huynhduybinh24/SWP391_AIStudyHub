import { GraduationCap, FileSpreadsheet, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentPreviewProps {
  fileType: string
  fileName: string
  zoomScale: number
  currentPage: number
  totalPages: number
  subject?: string
  previewContent?: string
  isDownloadRestricted: boolean
}

// Reusable mock content based on Subject or File Name (matching DocumentDetailPage.tsx details)
const SUBJECT_DETAILS_MOCK: Record<
  string,
  {
    courseTitle: string
    courseCode: string
    overview: string
    objectives: string[]
    description: string
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
    description: 'Comprehensive curriculum overview for the Fall 2024 semester.'
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
    description: 'Comprehensive syllabus overview detailing software engineering models.'
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
    description: 'High-fidelity quick reference sheet for complex multivariable equations.'
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
    description: 'Laboratory notebook and synthesis manual outlining modern CRISPR gene modification.'
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
    description: 'Study notes outlining foundational quantum mechanical principles.'
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
    description: 'Detailed cognitive study handbook outlining modern spacing algorithms.'
  }
}

function getPageContent(subjectKey: string, pageNum: number, mockDetails: any) {
  if (pageNum === 1) {
    return {
      title: mockDetails.courseTitle,
      subtitle: mockDetails.courseCode,
      sectionTitle: 'Course Overview',
      body: mockDetails.overview,
      listTitle: 'Learning Objectives',
      items: mockDetails.objectives,
      showBrainImage: subjectKey === 'NEUROSCIENCE'
    }
  }

  return {
    title: mockDetails.courseTitle,
    subtitle: `${mockDetails.courseCode} — Page ${pageNum}`,
    sectionTitle: `Section ${pageNum - 1}.1 Foundational Theories & Core Precepts`,
    body: `This section details the critical theoretical frameworks and experimental protocols that apply to ${mockDetails.courseTitle}. Students are expected to understand the historical context, analyze key variables, and verify equations within their study groups.`,
    listTitle: 'Recommended Reading & Assessment',
    items: [
      'Review formulas and reference literature mentioned in Section 1.',
      'Draft a detailed concept summary explaining main derivations.',
      'Integrate chapter notes into your personal AI chatbot instance.'
    ],
    showBrainImage: false
  }
}

export function DocumentPreview({
  fileType,
  fileName,
  zoomScale,
  currentPage,
  totalPages,
  subject = 'GENERAL',
  previewContent,
  isDownloadRestricted
}: DocumentPreviewProps) {
  const normType = fileType.toLowerCase()
  const subjectKey = subject.toUpperCase()
  const mockDetails = SUBJECT_DETAILS_MOCK[subjectKey] || SUBJECT_DETAILS_MOCK.GENERAL

  // Standard content for PDF or default documents
  const pageContent = getPageContent(subjectKey, currentPage, mockDetails)

  // Render components according to normalized file type
  const renderPreviewContent = () => {
    // 1. Spreadsheet XLSX Layout
    if (normType === 'xlsx' || normType === 'xls') {
      const mockRows = [
        ['Index', 'Subject Name', 'Resource Code', 'Status', 'Shared Date', 'Volume'],
        ['1', 'Advanced Neuroscience', 'NEURO-402', 'Approved', '2026-05-20', '3.6 MB'],
        ['2', 'Advanced Software Eng', 'CS-402', 'In Progress', '2026-05-21', '3.8 MB'],
        ['3', 'Multivariable Calculus', 'MATH-202', 'Approved', '2026-05-18', '2.4 MB'],
        ['4', 'Molecular Genetics', 'BIO-305', 'Approved', '2026-05-22', '1.8 MB'],
        ['5', 'Quantum Mechanics', 'PHY-301', 'Queued', '2026-05-15', '5.7 MB'],
        ['6', 'Integrated Study Methods', 'GEN-101', 'Approved', '2026-05-19', '1.5 MB']
      ]

      return (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="bg-emerald-100 dark:bg-emerald-950 p-2.5 rounded-xl text-emerald-650 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">Spreadsheet Grid View</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Sheet1 &bull; Active cells: 42</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs font-medium border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                  <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-850 text-center w-8"></th>
                  {['A', 'B', 'C', 'D', 'E', 'F'].map((col) => (
                    <th key={col} className="py-2 px-3 border-r border-slate-200 dark:border-slate-850 text-center uppercase font-bold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                {mockRows.map((row, idx) => (
                  <tr key={idx} className={cn("hover:bg-slate-50/50 dark:hover:bg-slate-800/30", idx === 0 && "bg-slate-50/30 dark:bg-slate-900/50 font-bold")}>
                    <td className="py-2 px-3 bg-slate-50/60 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 font-bold select-none">
                      {idx + 1}
                    </td>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 border-r border-slate-200 dark:border-slate-850 font-sans text-slate-700 dark:text-slate-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // 2. Image Preview
    if (normType === 'image' || normType === 'png' || normType === 'jpg' || normType === 'jpeg') {
      return (
        <div className="flex flex-col items-center justify-center p-6 space-y-6 text-center animate-fade-in">
          <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 max-w-sm w-full shadow-inner flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
              <ImageIcon className="h-8 w-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{fileName}</h4>
            <p className="text-[11px] text-slate-450 dark:text-slate-500">Image Asset &bull; 1920x1080px</p>
          </div>
          
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-md max-w-md bg-slate-900 p-2 relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none opacity-60" />
            <img
              src="/glowing_blue_brain.png"
              alt="Neural Brain Graph Graphic View"
              className="w-full h-auto object-cover rounded-xl select-none"
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.style.display = 'none'
              }}
            />
            {/* Styled Fallback Graphic */}
            <div className="w-full aspect-video rounded-xl bg-slate-950 flex flex-col items-center justify-center text-slate-500 p-6 space-y-2 select-none border border-slate-800">
              <span className="text-[10px] font-mono tracking-widest text-[#2563eb]">NEURAL GRAPH MATRIX</span>
              <div className="flex gap-1 items-center justify-center">
                <span className="size-2 rounded-full bg-blue-500 animate-ping" />
                <span className="text-xs font-bold text-slate-450">Active Graphic Canvas Stream</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // 3. Document text (DOCX/TXT/plain text) Layout
    if (normType === 'docx' || normType === 'txt' || normType === 'text') {
      return (
        <div className="space-y-6 text-left animate-fade-in font-sans leading-relaxed text-slate-700 dark:text-slate-350">
          <div className="border-b border-slate-150 dark:border-slate-800 pb-5">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {fileName.replace(/\.[^/.]+$/, "")}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1 uppercase tracking-wider">
              Document Text Stream &bull; {subjectKey} Scope
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">1. Executive Overview</h3>
            <p className="text-sm text-justify">
              {previewContent || pageContent.body}
            </p>
            
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-6">2. Core Objectives & Conceptual Models</h3>
            <p className="text-sm text-justify">
              The primary focus is to analyze, integrate, and synthesize complex subject components. Students should practice active retrieval to consolidate long-term retention of these models.
            </p>
            <ul className="space-y-2 pl-5 list-disc text-sm">
              <li>Formulate fundamental understandings of related theories.</li>
              <li>Perform practical sweeps and verify analytical calculations.</li>
              <li>Sync study guides to active AI workspaces for automated quizzes.</li>
            </ul>
          </div>
        </div>
      )
    }

    // 4. Default: PDF style (matches custom getPageContent detail)
    return (
      <div className="text-left animate-fade-in">
        {/* Graduate Cap absolute badge */}
        <div className="absolute top-8 right-8 bg-blue-100/80 dark:bg-slate-800 text-blue-650 dark:text-blue-400 p-2.5 rounded-2xl flex items-center justify-center border border-blue-200/30 dark:border-slate-700">
          <GraduationCap className="h-5 w-5" />
        </div>

        {/* Title & metadata heading header */}
        <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-serif leading-tight">
            {pageContent.title}
          </h1>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 font-mono tracking-wider">
            {pageContent.subtitle}
          </p>
        </div>

        {/* Course Overview Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-150 font-sans tracking-wide">
            {pageContent.sectionTitle}
          </h3>
          <p className="text-sm text-slate-655 dark:text-slate-350 leading-relaxed font-sans text-justify">
            {previewContent || pageContent.body}
          </p>
        </div>

        {/* Learning Objectives Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-150 font-sans tracking-wide">
            {pageContent.listTitle}
          </h3>
          <ul className="space-y-3 pl-1">
            {pageContent.items.map((obj, i) => (
              <li key={i} className="flex items-start gap-3.5 text-sm text-slate-655 dark:text-slate-350 font-sans leading-relaxed">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Neural Brain Graphic block with glowing overlay */}
        {pageContent.showBrainImage && (
          <div className="mt-8 border border-slate-200/85 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-slate-950 p-2.5 relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none opacity-60 transition-opacity" />
            <img
              src="/glowing_blue_brain.png"
              alt="Glowing Brain Neural Network Graph"
              className="w-full h-auto object-cover rounded-xl select-none"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            {/* Fallback Graphic */}
            <div className="w-full aspect-video rounded-xl bg-slate-950 flex flex-col items-center justify-center text-slate-500 p-6 space-y-2 select-none border border-slate-800">
              <span className="text-[10px] font-mono tracking-widest text-[#2563eb]">NEURAL GRAPH MATRIX</span>
              <div className="flex gap-1 items-center justify-center">
                <span className="size-2 rounded-full bg-blue-500 animate-ping" />
                <span className="text-xs font-bold text-slate-450">Active Graphic Canvas Stream</span>
              </div>
            </div>
          </div>
        )}

        {/* Sheet page footer number */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-10 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono">
          <span>© 2026 AI Study Hub. Empowering Deep Learning.</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="flex-1 overflow-auto bg-slate-700/10 dark:bg-slate-950/20 p-8 flex items-start justify-center min-h-[620px] max-h-[820px] relative scrollbar-thin"
      role="region"
      aria-label="Document Content Preview"
    >
      <div
        className={cn(
          "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl p-10 max-w-[690px] w-full border border-slate-200 dark:border-slate-800 origin-top transition-all duration-300 relative overflow-hidden",
          isDownloadRestricted && "select-none"
        )}
        style={{ transform: `scale(${zoomScale / 100})` }}
      >
        {renderPreviewContent()}
      </div>
    </div>
  )
}
