import { ArrowLeft } from 'lucide-react'
import { FileViewer } from '@/components/shared/file-viewer/FileViewer'
import { SharedFile } from './SharedFilesTable'

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
  const backLink = (
    <button
      type="button"
      onClick={onBack}
      className="group flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-750 hover:text-slate-900 dark:text-slate-200 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 cursor-pointer"
      aria-label="Back to Shared Files"
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
      <span>← Back to Shared Files</span>
    </button>
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
    />
  )
}

export default SharedFileViewer
