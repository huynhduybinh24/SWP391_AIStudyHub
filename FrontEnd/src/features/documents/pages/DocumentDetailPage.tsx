import { useEffect, useState } from 'react'
import { useParams, useOutletContext, useSearchParams } from 'react-router-dom'
import BackButton from '@/components/shared/BackButton'
import { FileViewer } from '@/components/shared/file-viewer/FileViewer'
import { documentService } from '@/services/documentService'

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
  openQuizModal: (doc?: DocumentItem) => void
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
    tags: string[]
    description: string
    pagesCount: number
  }
> = {
  NEUROSCIENCE: {
    courseTitle: 'Advanced Neuroscience',
    courseCode: 'NEURO-402 Syllabus 2024',
    tags: ['#Neuro', '#2024', '#Syllabus'],
    description: 'Comprehensive curriculum overview for the Fall 2024 semester, including weekly reading lists, lab schedules, and grading rubrics for NEURO-402.',
    pagesCount: 42
  },
  COMPSCI: {
    courseTitle: 'Advanced Software Engineering',
    courseCode: 'CS-402 Study Guide 2024',
    tags: ['#SoftwareEng', '#DesignPatterns', '#Microservices'],
    description: 'Comprehensive syllabus overview detailing software engineering models, design pattern catalogs, weekly coding exercises, and grading policies.',
    pagesCount: 28
  },
  MATHEMATICS: {
    courseTitle: 'Multivariable Calculus & Linear Algebra',
    courseCode: 'MATH-202 Reference Sheet',
    tags: ['#Calculus', '#MathSheet', '#LinearAlgebra'],
    description: 'High-fidelity quick reference sheet for complex multivariable equations, gradient computations, and matrix transformation rules.',
    pagesCount: 15
  },
  BIOLOGY: {
    courseTitle: 'Molecular Genetics & Cell Biology',
    courseCode: 'BIO-305 Lab Companion',
    tags: ['#Genetics', '#CellBio', '#LabNotes'],
    description: 'Laboratory notebook and synthesis manual outlining modern CRISPR gene modification systems, cellular signaling cascades, and transcription rules.',
    pagesCount: 34
  },
  PHYSICS: {
    courseTitle: 'Quantum Mechanics & Wave Theory',
    courseCode: 'PHY-301 Core Formulation',
    tags: ['#Quantum', '#WaveTheory', '#Formulas'],
    description: 'Study notes outlining foundational quantum mechanical principles, wave equations, and photoelectric effect experiments.',
    pagesCount: 20
  },
  GENERAL: {
    courseTitle: 'Integrated Academic Study Methods',
    courseCode: 'GEN-101 Course Companion',
    tags: ['#StudySkills', '#RecallMethod', '#AIAssistant'],
    description: 'Detailed cognitive study handbook outlining modern spacing algorithms, self-testing strategies, and structural planning systems.',
    pagesCount: 12
  }
}

export default function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const [searchParams] = useSearchParams()
  const pageParam = searchParams.get('page')
  const [previewContent, setPreviewContent] = useState<string>('')
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  
  const {
    documents,
    showToast,
    handleDownloadFile,
    openQuizModal
  } = useOutletContext<DocumentsContextType>()

  useEffect(() => {
    if (!documentId) return
    setIsLoadingPreview(true)
    documentService.previewDocument(documentId)
      .then((content) => {
        // Only set preview if it's not a binary file
        if (content && !content.startsWith('%PDF') && content.length < 500000) {
          setPreviewContent(content)
        } else {
          setPreviewContent('')
        }
      })
      .catch((err) => {
        console.error('Failed to fetch document preview:', err)
        setPreviewContent('')
      })
      .finally(() => {
        setIsLoadingPreview(false)
      })
  }, [documentId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual'
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })
      const scrollableContainers = document.querySelectorAll('.overflow-y-auto, [class*="overflow-y-auto"], .overflow-auto, [class*="overflow-auto"]')
      scrollableContainers.forEach((container) => {
        container.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        })
      })
    }
  }, [documentId])

  useEffect(() => {
    if (documentId) {
      const doc = documents.find(d => d.id === documentId)
      const docTitle = doc?.title || doc?.fileName || mockDetails.courseTitle
      const courseCode = doc?.course || mockDetails.courseCode?.split(' ')[0] || 'GENERAL'
      
      let progress = 25
      let resumeLabel = 'Resume from page 3'
      
      try {
        const stored = localStorage.getItem('aiStudyHubLastOpenedDocument')
        if (stored) {
          const item = JSON.parse(stored)
          if (item.id === documentId) {
            progress = item.progress
            resumeLabel = item.resumeLabel
          }
        }
      } catch (e) {}

      const itemToSave = {
        id: documentId,
        title: docTitle,
        course: courseCode,
        progress,
        lastOpened: 'Just now',
        resumeLabel
      }
      
      localStorage.setItem('aiStudyHubLastOpenedDocument', JSON.stringify(itemToSave))
      window.dispatchEvent(new Event('aiStudyHubLastOpenedDocumentUpdated'))
    }
  }, [documentId, documents, mockDetails])

  const activeDoc = documents.find(d => d.id === documentId)
  
  const subjectKey = (activeDoc?.subject || 'NEUROSCIENCE').toUpperCase()
  const mockDetails = SUBJECT_DETAILS_MOCK[subjectKey] || SUBJECT_DETAILS_MOCK.GENERAL

  const handleDownload = () => {
    if (activeDoc) {
      handleDownloadFile(activeDoc)
    } else {
      showToast(`Simulating download for: ${mockDetails.courseTitle}.pdf`)
    }
  }

  const backLink = (
    <BackButton
      label="Back to Documents"
      to="/dashboard/documents"
    />
  )

  return (
    <FileViewer
      fileName={activeDoc?.title || activeDoc?.fileName || mockDetails.courseTitle}
      fileType={activeDoc?.type || 'pdf'}
      fileSize={activeDoc?.size || '1.2 MB'}
      uploadedAt={activeDoc?.uploadedAt || 'Uploaded Oct 12, 2024'}
      description={mockDetails.description}
      tags={mockDetails.tags}
      totalPages={mockDetails.pagesCount}
      subject={activeDoc?.subject || 'NEUROSCIENCE'}
      showToast={showToast}
      onDownload={handleDownload}
      onBackLink={backLink}
      permission="Owner"
      onQuiz={activeDoc ? () => openQuizModal(activeDoc) : undefined}
      initialPage={pageParam ? Number(pageParam) : undefined}
      documentId={documentId}
      previewContent={previewContent}
    />
  )
}
