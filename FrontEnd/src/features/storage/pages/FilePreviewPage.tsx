import {
  ArrowLeft,
  FileText,
  ZoomOut,
  ZoomIn,
  Maximize,
  Share2,
  Download
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'

export function FilePreviewPage() {
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
            <Button variant="outline" className="gap-2 text-[#2563eb] border-[#2563eb]/20 hover:bg-[#2563eb]/5 bg-white h-10 px-4">
              <Share2 className="size-4" />
              Share Access
            </Button>
            <Button className="gap-2 bg-[#2563eb] hover:bg-[#2563eb]/90 text-white h-10 px-4">
              <Download className="size-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left PDF Viewer */}
        <div className="flex-1 flex flex-col w-full">
          {/* Viewer Toolbar */}
          <div className="h-12 bg-white border border-border rounded-t-xl flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-[#ef4444]" />
              <span className="text-sm font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">Neuroscience_Ch4_Synap...</span>
            </div>
            <div className="flex items-center gap-4 text-muted text-sm font-medium">
              <div className="hidden sm:flex items-center gap-3">
                <button className="hover:text-foreground transition-colors p-1"><ZoomOut className="size-4" /></button>
                <span className="w-12 text-center">100%</span>
                <button className="hover:text-foreground transition-colors p-1"><ZoomIn className="size-4" /></button>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border"></div>
              <span>Page 1 / 42</span>
              <button className="hover:text-foreground transition-colors p-1 hidden sm:block"><Maximize className="size-4" /></button>
            </div>
          </div>
          
          {/* Document Content */}
          <div className="bg-[#f8fafc] border border-t-0 border-border rounded-b-xl p-4 sm:p-8 flex justify-center min-h-[600px] overflow-hidden">
            <div className="bg-white w-full max-w-[600px] shadow-sm border border-border p-6 sm:p-10 flex flex-col h-fit">
              <h2 className="text-2xl sm:text-[28px] font-bold leading-tight text-[#1e293b] mb-1">Advanced Neuroscience: Neural<br/>Connectivity & Synaptic Plasticity</h2>
              <p className="text-[#3b82f6] text-[11px] font-bold tracking-widest uppercase mb-6">NEURO-402 SYLLABUS 2024</p>
              
              <div className="w-full aspect-[2/1] bg-black rounded-lg mb-8 overflow-hidden relative border border-border">
                <img src="/brain-network.png" alt="Brain network" className="w-full h-full object-cover opacity-90 mix-blend-screen" />
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-4 bg-[#3b82f6]"></div>
                <h3 className="text-[13px] font-bold tracking-widest text-[#1e293b] uppercase">COURSE OVERVIEW</h3>
              </div>
              <p className="text-[13px] text-muted leading-relaxed mb-6">
                This course explores the fundamental mechanisms of neuronal communication and the dynamic processes of synaptic plasticity. We examine how molecular signaling pathways translate environmental stimuli into long-term changes in neural circuit architecture and behavior.
              </p>
            </div>
          </div>
        </div>

        {/* Right Details Panel */}
        <Card className="w-full lg:w-[320px] shrink-0 border-border bg-white shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground text-lg mb-6">File Details</h3>
            
            <div className="flex flex-col gap-5 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted font-medium">Type</span>
                <span className="text-[10px] font-bold bg-[#e5eeff] text-[#2563eb] px-2 py-1 rounded">PDF DOCUMENT</span>
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
                  <Avatar src="/avatar.svg" name="Me" className="size-6 border border-border" />
                  <span className="font-semibold text-foreground">Me</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">TAGS</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#e5eeff] text-[#2563eb] text-xs font-medium rounded-full">Biology</span>
                <span className="px-3 py-1 bg-[#e5eeff] text-[#2563eb] text-xs font-medium rounded-full">Exam Prep</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
