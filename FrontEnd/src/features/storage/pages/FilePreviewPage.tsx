import { useState } from 'react'
import {
  ArrowLeft,
  FileText,
  ZoomOut,
  ZoomIn,
  Maximize,
  Minimize,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  X,
  Plus
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'

export function FilePreviewPage() {
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [isShared, setIsShared] = useState(false)
  const [tags, setTags] = useState(['Biology', 'Exam Prep'])
  const [newTag, setNewTag] = useState('')
  const [isAddingTag, setIsAddingTag] = useState(false)
  const totalPages = 42

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50))
  
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))

  const handleDownload = () => {
    setIsDownloading(true)
    setTimeout(() => {
      setIsDownloading(false)
      setIsDownloaded(true)
      setTimeout(() => setIsDownloaded(false), 3000)
    }, 1500)
  }

  const handleShare = () => {
    setIsShared(true)
    setTimeout(() => setIsShared(false), 3000)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove))
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = newTag.trim()
      if (trimmed !== '' && !tags.includes(trimmed)) {
        setTags([...tags, trimmed])
      }
      setNewTag('')
      setIsAddingTag(false)
    } else if (e.key === 'Escape') {
      setNewTag('')
      setIsAddingTag(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div>
        <Link 
          to="/dashboard/storage/explorer" 
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Storage Explorer
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-foreground leading-tight">File Preview</h1>
            <p className="text-muted mt-2 text-sm">
              Preview, download, share, or analyze your cloud file.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleShare}
              variant="secondary" 
              className={`gap-2 h-10 px-4 transition-colors ${
                isShared 
                  ? 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300' 
                  : 'text-[#2563eb] border-[#2563eb]/20 hover:bg-[#2563eb]/5 bg-white dark:bg-slate-900 dark:text-blue-400 dark:border-blue-500/30 dark:hover:bg-[#2563eb]/10'
              }`}
            >
              {isShared ? <Check className="size-4" /> : <Share2 className="size-4" />}
              {isShared ? 'Link Copied' : 'Share Access'}
            </Button>
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className={`gap-2 h-10 px-4 transition-colors ${
                isDownloaded
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#2563eb] hover:bg-[#2563eb]/90 text-white'
              }`}
            >
              {isDownloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isDownloaded ? (
                <Check className="size-4" />
              ) : (
                <Download className="size-4" />
              )}
              {isDownloading ? 'Downloading...' : isDownloaded ? 'Downloaded' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left PDF Viewer */}
        <div className={isFullscreen ? "fixed inset-0 z-50 bg-[#f8fafc] dark:bg-slate-950 flex flex-col w-full h-full" : "flex-1 flex flex-col w-full"}>
          {/* Viewer Toolbar */}
          <div className={`h-12 bg-white dark:bg-slate-900 border-border dark:border-slate-800 flex items-center justify-between px-4 ${isFullscreen ? 'border-b' : 'border rounded-t-xl'}`}>
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-[#ef4444]" />
              <span className="text-sm font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">Neuroscience_Ch4_Synap...</span>
            </div>
            <div className="flex items-center gap-4 text-muted text-sm font-medium">
              <div className="hidden sm:flex items-center gap-3">
                <button onClick={handleZoomOut} className="hover:text-foreground transition-colors p-1" title="Zoom Out"><ZoomOut className="size-4" /></button>
                <span className="w-12 text-center select-none">{zoom}%</span>
                <button onClick={handleZoomIn} className="hover:text-foreground transition-colors p-1" title="Zoom In"><ZoomIn className="size-4" /></button>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border dark:bg-slate-800"></div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1}
                  className="hover:text-foreground disabled:opacity-50 transition-colors p-1"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="select-none min-w-[70px] text-center">Page {currentPage} / {totalPages}</span>
                <button 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages}
                  className="hover:text-foreground disabled:opacity-50 transition-colors p-1"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border dark:bg-slate-800"></div>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="hover:text-foreground transition-colors p-1 hidden sm:block" title="Toggle Fullscreen">
                {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
              </button>
            </div>
          </div>
          
          {/* Document Content */}
          <div className={`bg-[#f8fafc] dark:bg-slate-950 border-border dark:border-slate-800 p-4 sm:p-8 flex justify-center overflow-auto ${isFullscreen ? 'flex-1' : 'border border-t-0 rounded-b-xl min-h-[600px]'}`}>
            <div 
              className="bg-white dark:bg-slate-900 w-full max-w-[600px] shadow-sm border border-border dark:border-slate-800 p-6 sm:p-10 flex flex-col h-fit transition-all duration-200"
              style={{ zoom: `${zoom}%` } as React.CSSProperties}
            >
              <h2 className="text-2xl sm:text-[28px] font-bold leading-tight text-[#1e293b] dark:text-slate-100 mb-1">
                Advanced Neuroscience: Neural Connectivity & Synaptic Plasticity
              </h2>
              <div className="flex justify-between items-center mb-6 mt-2">
                <p className="text-[#3b82f6] text-[11px] font-bold tracking-widest uppercase">NEURO-402 SYLLABUS 2024</p>
                <span className="text-[11px] text-muted font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">PAGE {currentPage}</span>
              </div>
              
              <div className="w-full aspect-[2/1] bg-black rounded-lg mb-8 overflow-hidden relative border border-border dark:border-slate-800">
                <img src="/brain-network.png" alt="Brain network" className="w-full h-full object-cover opacity-90 mix-blend-screen" />
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-4 bg-[#3b82f6]"></div>
                <h3 className="text-[13px] font-bold tracking-widest text-[#1e293b] dark:text-slate-100 uppercase">COURSE OVERVIEW</h3>
              </div>
              <p className="text-[13px] text-muted leading-relaxed mb-6">
                This course explores the fundamental mechanisms of neuronal communication and the dynamic processes of synaptic plasticity. We examine how molecular signaling pathways translate environmental stimuli into long-term changes in neural circuit architecture and behavior.
              </p>
            </div>
          </div>
        </div>

        {/* Right Details Panel */}
        <Card className="w-full lg:w-[320px] shrink-0 border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm lg:sticky lg:top-6">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground text-lg mb-6">File Details</h3>
            
            <div className="flex flex-col gap-5 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted font-medium">Type</span>
                <span className="text-[10px] font-bold bg-[#e5eeff] dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-400 px-2 py-1 rounded">PDF DOCUMENT</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted font-medium">Size</span>
                <span className="font-semibold text-foreground text-right">4.2 MB</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted font-medium">Uploaded</span>
                <span className="font-semibold text-foreground text-right">Oct 24, 2024</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted font-medium">Owner</span>
                <div className="flex items-center gap-2">
                  <Avatar src="/avatar.svg" name="Me" className="size-6 border border-border dark:border-slate-800" />
                  <span className="font-semibold text-foreground">Me</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">TAGS</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="group px-3 py-1 bg-[#e5eeff] dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[#2563eb] dark:text-blue-400 text-xs font-medium rounded-full flex items-center gap-1.5 cursor-default transition-colors">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="opacity-0 group-hover:opacity-100 hover:text-blue-800 dark:hover:text-blue-200 transition-opacity focus:opacity-100 outline-none">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {isAddingTag ? (
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    onBlur={() => {
                      setNewTag('')
                      setIsAddingTag(false)
                    }}
                    autoFocus
                    className="px-3 py-1 text-xs border border-blue-200 dark:border-blue-900/50 rounded-full focus:outline-none focus:border-[#2563eb] dark:focus:border-blue-500 w-24 bg-white dark:bg-slate-800 text-foreground"
                    placeholder="New tag..."
                  />
                ) : (
                  <button 
                    onClick={() => setIsAddingTag(true)}
                    className="px-3 py-1 border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#2563eb] dark:hover:border-blue-500 text-muted hover:text-[#2563eb] dark:hover:text-blue-400 text-xs font-medium rounded-full flex items-center gap-1 transition-colors outline-none"
                  >
                    <Plus className="size-3" /> Add
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
