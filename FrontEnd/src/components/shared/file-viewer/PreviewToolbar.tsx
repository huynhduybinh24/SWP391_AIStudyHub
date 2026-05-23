import { useState, useEffect } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Printer,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface PreviewToolbarProps {
  zoomScale: number
  onZoomIn: () => void
  onZoomOut: () => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPrint: () => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  fileName: string
}

export function PreviewToolbar({
  zoomScale,
  onZoomIn,
  onZoomOut,
  currentPage,
  totalPages,
  onPageChange,
  onPrint,
  isFullscreen,
  onToggleFullscreen,
  fileName
}: PreviewToolbarProps) {
  const [pageInputStr, setPageInputStr] = useState(currentPage.toString())

  useEffect(() => {
    setPageInputStr(currentPage.toString())
  }, [currentPage])

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value
    setPageInputStr(rawVal)
    
    const val = parseInt(rawVal, 10)
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      onPageChange(val)
    }
  }

  const handlePageInputBlur = () => {
    setPageInputStr(currentPage.toString())
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div 
      className="flex flex-wrap items-center justify-between gap-4 border-b bg-blue-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-6 py-4"
      aria-label="Document Viewer Toolbar"
    >
      {/* Zoom Controls block */}
      <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 px-3.5 py-1.5 rounded-2xl">
        <button
          type="button"
          onClick={onZoomOut}
          disabled={zoomScale <= 50}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 p-1.5 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-350 select-none min-w-[36px] text-center">
          {zoomScale}%
        </span>
        <button
          type="button"
          onClick={onZoomIn}
          disabled={zoomScale >= 200}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 p-1.5 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Page navigation block */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="text-slate-655 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all shadow-sm cursor-pointer"
          aria-label="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={pageInputStr}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            aria-label="Current Page Number"
            className="w-12 text-center font-bold text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 py-1 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold select-none">
            of {totalPages}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="text-slate-655 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all shadow-sm cursor-pointer"
          aria-label="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Actions block right-aligned */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrint}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-xl border border-slate-250/40 dark:border-slate-700 transition-colors cursor-pointer"
          title={`Print ${fileName}`}
          aria-label="Print Document"
        >
          <Printer className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-xl border border-slate-250/40 dark:border-slate-700 transition-colors cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
