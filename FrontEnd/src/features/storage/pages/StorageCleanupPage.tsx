import { ArrowLeft, FileText, Loader2, Video, Archive } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useState } from 'react'

const INITIAL_DUPLICATES = [
  {
    id: '1',
    name: 'Lecture_Notes_v1.pdf',
    size: '2.4 MB',
    modified: 'Modified 2 days ago',
  },
  {
    id: '2',
    name: 'Research_Draft_Copy.docx',
    size: '1.8 MB',
    modified: 'Modified 1 week ago',
  },
  {
    id: '3',
    name: 'Dataset_Analysis_Final.csv',
    size: '4.5 MB',
    modified: 'Modified 3 weeks ago',
  }
]

const DEEP_ANALYSIS_FILES = [
  {
    id: '4',
    name: 'Introduction_To_AI_Video.mp4',
    size: '850 MB',
    modified: 'Modified 6 months ago',
    icon: Video,
    color: 'text-purple-600',
    bg: 'bg-purple-100'
  },
  {
    id: '5',
    name: 'Raw_Data_Archive.zip',
    size: '1.2 GB',
    modified: 'Modified 1 year ago',
    icon: Archive,
    color: 'text-amber-600',
    bg: 'bg-amber-100'
  }
]

export function StorageCleanupPage() {
  const [duplicates, setDuplicates] = useState(INITIAL_DUPLICATES)
  const [largeFiles, setLargeFiles] = useState(DEEP_ANALYSIS_FILES)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const totalFilesFound = 24

  const handleRemove = (id: string) => {
    setDuplicates(prev => prev.filter(item => item.id !== id))
  }

  const handleRemoveLarge = (id: string) => {
    setLargeFiles(prev => prev.filter(item => item.id !== id))
  }

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setHasAnalyzed(true)
    }, 2000)
  }

  const usedGB = 8.5
  const totalGB = 15
  const percentage = (usedGB / totalGB) * 100

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
      <div>
        <Link 
          to="/dashboard/storage" 
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Cloud Storage
        </Link>
        <div>
          <h1 className="text-[32px] font-bold text-foreground leading-tight">Storage Cleanup</h1>
          <p className="text-muted mt-2 text-sm">
            Manage and optimize your cloud storage space.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column */}
        <div className="flex-1 flex flex-col w-full gap-6">
          <Card className="border-border shadow-sm">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Duplicate Files</h2>
              <span className="text-sm font-medium text-muted">{totalFilesFound} files found</span>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                {duplicates.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-[#f8fafc] border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#eff6ff] rounded-lg flex items-center justify-center shrink-0">
                        <div className="relative flex items-center justify-center">
                          <FileText className="size-6 text-[#3b82f6]" strokeWidth={1.5} />
                          {file.name.endsWith('.pdf') && (
                            <span className="absolute bottom-1 right-0 bg-[#3b82f6] text-white text-[7px] font-bold px-1 rounded-sm">
                              PDF
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[15px] text-foreground">{file.name}</span>
                        <span className="text-[12px] text-muted mt-0.5">{file.size} • {file.modified}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemove(file.id)}
                      className="text-[#ef4444] text-[13px] font-semibold hover:text-red-600 px-3 py-1.5 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {duplicates.length === 0 && (
                  <div className="text-center text-sm text-muted py-8">
                    All clear! No more duplicates shown.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {hasAnalyzed && (
            <Card className="border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-bold text-foreground">Large Unused Files</h2>
                <span className="text-sm font-medium text-muted">{largeFiles.length} files found</span>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  {largeFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-[#f8fafc] border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${file.bg} rounded-lg flex items-center justify-center shrink-0`}>
                          <file.icon className={`size-6 ${file.color}`} strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[15px] text-foreground">{file.name}</span>
                          <span className="text-[12px] text-muted mt-0.5">{file.size} • {file.modified}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveLarge(file.id)}
                        className="text-[#ef4444] text-[13px] font-semibold hover:text-red-600 px-3 py-1.5 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {largeFiles.length === 0 && (
                    <div className="text-center text-sm text-muted py-8">
                      Great job! No more large unused files.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <Card className="w-full lg:w-[320px] shrink-0 border-border shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-[17px] font-bold text-foreground mb-6">Storage Summary</h3>
            
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-muted">Used Space</span>
                <span className="text-sm font-bold text-foreground">{usedGB} GB / {totalGB} GB</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1d4ed8] rounded-full transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>

            <p className="text-sm text-muted mb-6 leading-relaxed">
              You can free up to <span className="font-bold text-foreground">1.2 GB</span> by removing recommended files.
            </p>

            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || hasAnalyzed}
              className={`w-full h-[42px] text-sm font-medium transition-colors ${
                hasAnalyzed 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-[#1e293b] hover:bg-[#0f172a] text-white'
              }`}
            >
              {isAnalyzing && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isAnalyzing ? 'Analyzing Space...' : hasAnalyzed ? 'Analysis Complete' : 'Analyze Deeply'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
