import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, FileText, FileSpreadsheet, Image as ImageIcon, Download, Share2, Edit3, Trash2, Eye, Calendar, User, Info, Folder
} from 'lucide-react'
import { SharedFile } from './SharedFilesTable'

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  file: SharedFile | null
  onDownload: (file: SharedFile) => void
  onShare: (file: SharedFile) => void
  onRename: (file: SharedFile) => void
  onDelete: (file: SharedFile) => void
}

export function FilePreviewModal({
  isOpen,
  onClose,
  file,
  onDownload,
  onShare,
  onRename,
  onDelete
}: FilePreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    )
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && focusableElements) {
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!file) return null

  const getFileIcon = (type: SharedFile['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="size-6 text-red-500" />
      case 'xlsx':
        return <FileSpreadsheet className="size-6 text-emerald-500" />
      case 'docx':
        return <FileText className="size-6 text-blue-500" />
      case 'folder':
        return <Folder className="size-6 text-indigo-500" />
      default:
        return <FileText className="size-6 text-slate-500" />
    }
  }

  // Previews based on file types
  const renderPreviewContent = () => {
    switch (file.type) {
      case 'pdf':
        return (
          <div className="space-y-6 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
            {/* Page 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
                <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">Page 1 of 2</span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Biology 101 Notes</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">Chapter 3: Cell Division and Mitosis</h2>
              <p className="text-sm font-semibold text-slate-655 dark:text-slate-350 leading-relaxed mb-4">
                Cell division is the process by which a parent cell divides into two or more daughter cells. In eukaryotes, cell division occurs via mitosis or meiosis. Mitosis is a process of nuclear division in eukaryotic cells that occurs when a parent cell divides to produce two identical daughter cells.
              </p>
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100/30 dark:border-blue-900/30 rounded-2xl mb-4 text-xs font-bold text-[#3155F6] dark:text-blue-400">
                Key Concept: Mitosis results in diploid cells (2n), while meiosis produces haploid gametes (n).
              </div>
              <p className="text-sm font-semibold text-slate-655 dark:text-slate-350 leading-relaxed">
                The mitotic phase (M phase) of the cell cycle is a multi-step process during which the duplicated chromosomes are aligned, separated, and moved to opposite poles of the cell, and then the cell is divided into two new identical daughter cells.
              </p>
            </div>
            
            {/* Page 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
                <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">Page 2 of 2</span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Biology 101 Notes</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-2.5">Stages of Mitosis</h3>
              <ul className="list-disc list-inside space-y-2 text-sm font-semibold text-slate-655 dark:text-slate-350 leading-relaxed">
                <li><strong className="text-slate-850 dark:text-slate-200">Prophase:</strong> Chromatin condenses into chromosomes, nuclear envelope breaks down, mitotic spindle begins to form.</li>
                <li><strong className="text-slate-850 dark:text-slate-200">Metaphase:</strong> Chromosomes align along the metaphase plate in the center of the cell.</li>
                <li><strong className="text-slate-850 dark:text-slate-200">Anaphase:</strong> Sister chromatids are separated to opposite poles of the cell.</li>
                <li><strong className="text-slate-850 dark:text-slate-200">Telophase:</strong> Chromosomes decondense, nuclear envelopes re-form, followed closely by cytokinesis.</li>
              </ul>
            </div>
          </div>
        )
      case 'xlsx':
        // Grid Table Excel Mockup
        const rows = [
          ['Experiment ID', 'Trial 1 (s)', 'Trial 2 (s)', 'Trial 3 (s)', 'Average (s)', 'Error (%)'],
          ['EXP-01', '12.45', '12.60', '12.38', '12.48', '0.88%'],
          ['EXP-02', '15.10', '14.95', '15.22', '15.09', '1.12%'],
          ['EXP-03', '9.82', '9.90', '9.75', '9.82', '0.64%'],
          ['EXP-04', '22.30', '22.12', '22.45', '22.29', '1.05%'],
          ['EXP-05', '18.65', '18.77', '18.54', '18.65', '0.90%'],
          ['EXP-06', '14.22', '14.30', '14.18', '14.23', '0.72%']
        ]
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {/* Spreadsheet Headers */}
            <div className="flex border-b border-slate-100 dark:border-slate-850 bg-[#F4F7FE]/60 dark:bg-slate-800/40 divide-x divide-slate-100 dark:divide-slate-850">
              <div className="w-12 py-2 text-center text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Row</div>
              {['A', 'B', 'C', 'D', 'E', 'F'].map((col) => (
                <div key={col} className="flex-1 py-2 text-center text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{col}</div>
              ))}
            </div>
            {/* Spreadsheet Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-850 max-h-[360px] overflow-y-auto scrollbar-thin">
              {rows.map((row, rIdx) => (
                <div key={rIdx} className="flex divide-x divide-slate-100 dark:divide-slate-850 text-xs font-semibold hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div className="w-12 py-3 text-center bg-[#F4F7FE]/20 dark:bg-slate-800/10 text-slate-400 dark:text-slate-550 shrink-0 font-bold">{rIdx + 1}</div>
                  {row.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className={`flex-1 px-3 py-3 text-slate-700 dark:text-slate-300 truncate ${
                        rIdx === 0 ? 'bg-slate-50/50 dark:bg-slate-800/30 font-extrabold text-slate-900 dark:text-white' : ''
                      }`}
                      title={cell}
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )
      case 'docx':
      case 'txt':
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm max-h-[400px] overflow-y-auto scrollbar-thin text-sm font-semibold text-slate-655 dark:text-slate-350 leading-relaxed space-y-4">
            <h1 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
              {file.name.replace(/\.[^/.]+$/, '')}
            </h1>
            <p>
              This is a draft version of the document. All comments and suggestions should be logged in the system or sent to the project coordinators.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Sunt in culpa qui officia deserunt mollit anim id est laborum. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.
            </p>
          </div>
        )
      case 'png':
      case 'jpg':
        return (
          <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800/40 rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px] shadow-inner relative overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80"
              alt={file.name}
              className="max-h-[360px] max-w-full rounded-lg object-contain border border-slate-200/50 dark:border-slate-800 shadow-md group-hover:scale-[1.01] transition-transform duration-300"
            />
            <div className="absolute bottom-6 left-6 right-6 bg-[#0b1c30]/75 dark:bg-black/75 backdrop-blur-sm px-4 py-2.5 rounded-xl text-center text-xs font-bold text-white max-w-xs mx-auto border border-white/10 opacity-90">
              Mock Image Preview
            </div>
          </div>
        )
      default:
        // Directory folder preview
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <Folder className="size-16 text-indigo-500 fill-indigo-500/10 mb-4 animate-pulse" />
            <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 mb-1">{file.name}</h4>
            <p className="text-xs text-slate-450 dark:text-slate-500 max-w-xs font-semibold leading-relaxed">
              This is a container folder. Click on individual assets in the shared view page to open files inside.
            </p>
          </div>
        )
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-45 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative z-10 w-full max-w-[800px] overflow-hidden rounded-3xl bg-slate-50 p-6 shadow-2xl dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Title Block */}
            <div className="flex gap-4 items-start mb-6 border-b border-slate-200 dark:border-slate-850 pb-5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                {getFileIcon(file.type)}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 id="preview-title" className="text-lg font-black text-slate-905 dark:text-white truncate pr-6" title={file.name}>
                  {file.name}
                </h3>
                
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-450 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <User className="size-3.5 text-blue-500" />
                    <span>Owner: <strong>{file.owner}</strong></span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5 text-emerald-500" />
                    <span>Permission: <strong className="text-slate-700 dark:text-slate-300">{file.permissions}</strong></span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5 text-indigo-500" />
                    <span>Shared: <strong>{file.dateShared}</strong></span>
                  </span>
                  {file.size && (
                    <span className="flex items-center gap-1">
                      <Info className="size-3.5 text-slate-400" />
                      <span>Size: <strong>{file.size}</strong></span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Box */}
            <div className="mb-6 bg-slate-100/40 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-850">
              {renderPreviewContent()}
            </div>

            {/* Modal Actions Footer Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-200 dark:border-slate-850 mt-5">
              {/* Left Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onDownload(file)}
                  className="inline-flex items-center gap-2 bg-[#3155F6] hover:bg-[#2563eb] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-blue-500/10 active:scale-[0.98]"
                >
                  <Download className="size-4" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => onShare(file)}
                  className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-[0.98]"
                >
                  <Share2 className="size-4" />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRename(file)}
                  className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-[0.98]"
                >
                  <Edit3 className="size-4" />
                  <span>Rename</span>
                </button>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onDelete(file)}
                  className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-650 dark:text-red-400 border border-red-200/40 dark:border-red-900/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-[0.98]"
                >
                  <Trash2 className="size-4" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-200 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default FilePreviewModal
