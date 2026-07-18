import { useState, useEffect } from 'react'
import { FileViewer } from '@/components/shared/file-viewer/FileViewer'
import { SharedFile } from './SharedFilesTable'
import { QuizModal } from './QuizModal'

import BackToSharedFilesButton from '@/components/shared/BackToSharedFilesButton'

interface SharedFileViewerProps {
  file: SharedFile
  onBack: () => void
  showToast: (msg: string) => void
  onDownload: (file: SharedFile) => void
}

export function SharedFileViewer({
  file,
  onBack,
  showToast,
  onDownload
}: SharedFileViewerProps) {
  const [isQuizOpen, setIsQuizOpen] = useState(false)

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
  }, [])

  const backLink = (
    <BackToSharedFilesButton setViewingFile={onBack} />
  )

  // Map file categories or subject if present (e.g. from file tags or names)
  const resolvedSubject = file.name.toLowerCase().includes('biology')
    ? 'BIOLOGY'
    : file.name.toLowerCase().includes('calculus') || file.name.toLowerCase().includes('math')
    ? 'MATHEMATICS'
    : file.name.toLowerCase().includes('physics')
    ? 'PHYSICS'
    : file.name.toLowerCase().includes('design') || file.name.toLowerCase().includes('software')
    ? 'COMPSCI'
    : 'GENERAL'

  return (
    <>
      <FileViewer
        fileName={file.name}
        fileType={file.type}
        fileSize={file.size}
        uploadedAt={`Shared ${file.dateShared}`}
        description={file.description}
        tags={file.tags}
        totalPages={file.totalPages}
        subject={resolvedSubject}
        previewContent={file.previewContent}
        permission={file.permission}
        showToast={showToast}
        onDownload={() => onDownload(file)}
        onBackLink={backLink}
        fileUrl={file.url}
        onQuiz={() => setIsQuizOpen(true)}
        documentId={file.id}
      />

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        file={file}
      />
    </>
  )
}

export default SharedFileViewer

