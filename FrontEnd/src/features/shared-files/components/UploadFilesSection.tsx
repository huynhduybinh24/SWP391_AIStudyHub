import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import BackToSharedFilesButton from '@/components/shared/BackToSharedFilesButton'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { UploadDropzone } from './UploadDropzone'
import { UploadProgressCard } from './UploadProgressCard'
import { FileMetadataForm } from './FileMetadataForm'
import { SharedFile } from './SharedFilesTable'

interface UploadFilesSectionProps {
  onBack: () => void
  onSave: (newFile: SharedFile) => void
}

export function UploadFilesSection({ onBack, onSave }: UploadFilesSectionProps) {
  const toast = useToast()

  // Form states
  const [docTitle, setDocTitle] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('Biology')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Upload progress states
  const [fileAttached, setFileAttached] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [fileType, setFileType] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)

  // AI states
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiInsightsGenerated, setAiInsightsGenerated] = useState(false)

  // Progress Bar Simulation
  useEffect(() => {
    if (!fileAttached || uploadComplete) return

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploadComplete(true)
          toast.success('Upload completed successfully')
          triggerAIAnalysis()
          return 100
        }
        // Increment progress randomly
        const next = prev + Math.floor(Math.random() * 12) + 4
        return next > 100 ? 100 : next
      })
    }, 200)

    return () => clearInterval(interval)
  }, [fileAttached, uploadComplete])

  const triggerAIAnalysis = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setAiInsightsGenerated(true)
      toast.success('AI insights generated')
      
      // Auto-populate tags and description
      setSelectedTags(prev => [...new Set([...prev, 'Notes', selectedSubject])])
      if (!description.trim()) {
        setDescription(`AI Generated description for ${fileName}. Covers core details, summaries, and subject guidelines.`)
      }
    }, 1500)
  }

  const handleFileSelect = (file: File) => {
    setFileName(file.name)
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`)
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    setFileType(ext)
    
    setFileAttached(true)
    setUploadProgress(0)
    setUploadComplete(false)
    setAiInsightsGenerated(false)
    setIsAnalyzing(false)

    // Prefill title
    const cleanName = file.name.split('.')[0].replace(/[_-]/g, ' ')
    setDocTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
  }

  const handleCancelUpload = () => {
    setFileAttached(false)
    setFileName('')
    setFileSize('')
    setFileType('')
    setUploadProgress(0)
    setUploadComplete(false)
    setIsAnalyzing(false)
    setAiInsightsGenerated(false)
    setDocTitle('')
    setDescription('')
    setSelectedTags([])
    toast.success('Upload canceled')
    onBack()
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileAttached || !uploadComplete) {
      toast.warning('Please wait for the file to finish uploading')
      return
    }

    const finalTitle = docTitle.trim() || fileName.split('.')[0]
    
    const newSharedFile: SharedFile = {
      id: `file-upload-${Date.now()}`,
      name: finalTitle + (fileType ? `.${fileType}` : ''),
      owner: 'Alex Rivera',
      permission: 'Owner',
      dateShared: 'Just now',
      type: fileType as any,
      size: fileSize,
      description: description.trim() || 'No description provided.',
      tags: selectedTags,
      previewContent: `Preview Content of ${fileName}. Uploaded and analyzed by AI Study Hub.`,
      summary: `AI Quick Summary: This document covers key concepts in ${selectedSubject}. Preprocessed summary outlines primary terms, formulas, and structural study guides.`
    }

    onSave(newSharedFile)
  }

  return (
    <div className="space-y-6 max-w-[800px] mx-auto pt-2 pb-12 select-none">
      
      {/* 1. Header Back link */}
      <div className="flex items-center justify-between text-left">
        <BackToSharedFilesButton />
      </div>

      {/* 2. Title Description */}
      <div className="space-y-1 text-left">
        <h1 className="text-[30px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
          Upload Files
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-450 mt-1">
          Add new files to your shared workspace. AI will automatically generate summaries and insights.
        </p>
      </div>

      {/* 3. Main content form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xs space-y-6">
          
          {/* Dropzone & Progress Card */}
          <div className="space-y-4">
            {!fileAttached ? (
              <UploadDropzone
                onFileSelect={handleFileSelect}
                onValidationError={(msg) => toast.error(msg)}
              />
            ) : (
              <UploadProgressCard
                fileName={fileName}
                fileSize={fileSize}
                fileType={fileType}
                progress={uploadProgress}
                onCancel={() => {
                  setFileAttached(false)
                  setUploadComplete(false)
                }}
              />
            )}
          </div>

          {/* AI Loader */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/30 flex items-center justify-center gap-3 text-indigo-650 dark:text-indigo-400 text-xs font-black select-none"
            >
              <div className="size-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span>Analyzing uploaded file...</span>
            </motion.div>
          )}

          {/* Metadata Form */}
          {uploadComplete && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FileMetadataForm
                title={docTitle}
                onTitleChange={setDocTitle}
                subject={selectedSubject}
                onSubjectChange={setSelectedSubject}
                description={description}
                onDescriptionChange={setDescription}
                tags={selectedTags}
                onTagsChange={setSelectedTags}
              />
            </motion.div>
          )}

          {/* Footer Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={handleCancelUpload}
              className="rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs px-5 h-[44px] cursor-pointer transition-all text-xs active:scale-[0.98]"
            >
              Cancel Upload
            </button>
            <button
              type="submit"
              disabled={!fileAttached || !uploadComplete || isAnalyzing}
              className="group flex items-center gap-2 rounded-xl bg-[#3155F6] hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/10 px-6 h-[44px] cursor-pointer transition-all duration-200 disabled:opacity-50 text-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Save File</span>
            </button>
          </div>

        </div>
      </form>

    </div>
  )
}

export default UploadFilesSection
