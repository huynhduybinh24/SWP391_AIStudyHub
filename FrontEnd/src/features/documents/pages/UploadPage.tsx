import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CloudUpload,
  FileText,
  X,
  Sparkles,
  FileCheck,
  Image as ImageIcon,
  BookOpen,
  FileCode,
  Folder,
  Video,
  Volume2,
  Mic,
  Music,
  Trash2,
  Download,
  Edit2,
  Eye,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'

interface DocumentItem {
  id: string
  title: string
  fileName: string
  uploadedAt: string
  uploadedDateObj: Date
  size: string
  sizeKb: number
  subject: 'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL'
  status: 'ANALYZED' | 'PENDING' | 'SCANNING' | 'QUEUED'
  type: 'pdf' | 'word' | 'image' | 'text' | 'slides'
  essential?: boolean
}

const SUBJECT_MAP: Record<string, { title: string; courseCode: string }> = {
  COMPSCI: { title: 'Software Engineering', courseCode: 'CS-402' },
  MATHEMATICS: { title: 'Mathematics', courseCode: 'Calculus II' },
  BIOLOGY: { title: 'Molecular Biology', courseCode: 'BIO-201' },
  PHYSICS: { title: 'Physics', courseCode: 'PHY-301' },
  PHILOSOPHY: { title: 'Philosophy', courseCode: 'PHIL-101' },
  ECONOMICS: { title: 'Economics', courseCode: 'ECON-201' },
  GENERAL: { title: 'General Studies', courseCode: 'GEN-101' }
}

const AVAILABLE_TAGS = ['Notes', 'Assignment', 'Lecture', 'Midterm', 'Final Exam']

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-design-patterns',
    title: 'Design Patterns',
    fileName: 'Design_Patterns_Java_Guide.pdf',
    uploadedAt: 'Uploaded 2 hours ago',
    uploadedDateObj: new Date(),
    size: '3.8 MB',
    sizeKb: 3890,
    subject: 'COMPSCI',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'doc-agile',
    title: 'Agile Methodologies',
    fileName: 'Agile_Scrum_Kanban_DeepDive.docx',
    uploadedAt: 'Uploaded Yesterday',
    uploadedDateObj: new Date(Date.now() - 24 * 60 * 60 * 1000),
    size: '1.9 MB',
    sizeKb: 1945,
    subject: 'GENERAL',
    status: 'ANALYZED',
    type: 'word',
    essential: true,
  }
]

type UploadType = "document" | "video" | "audio" | "recording";

type UploadedMedia = {
  id: string;
  title: string;
  type: UploadType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  duration?: string;
  uploadedAt: string;
  description?: string;
  tags: string[];
};

export function UploadPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { language, t } = useTranslation()

  // Tab State
  const [activeTab, setActiveTab] = useState<UploadType>("document")

  // Form states
  const [docTitle, setDocTitle] = useState('Lecture_Notes_Week4')
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL'>('BIOLOGY')
  const [description, setDescription] = useState('Week 4 lecture covering cellular respiration and metabolic pathways.')
  const [selectedTags, setSelectedTags] = useState<string[]>(['Notes'])
  const [fileType, setFileType] = useState<'pdf' | 'word' | 'image' | 'text' | 'slides'>('pdf')
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>('private')
  const [generateSummary, setGenerateSummary] = useState(true)
  const [createFlashcards, setCreateFlashcards] = useState(true)

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileAttached, setFileAttached] = useState(true) // Start with default mockup pdf file attached for Document mode
  const [uploadProgress, setUploadProgress] = useState(75) // Start at 75% per Figma mockup
  const [uploadComplete, setUploadComplete] = useState(false)
  const [fileName, setFileName] = useState('Lecture_Notes_Week4.pdf')
  const [fileSize, setFileSize] = useState('1.8 MB')

  // Drag and drop / file states for Video & Audio
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Recording states
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "paused" | "stopped">("idle")
  const [recordingTimer, setRecordingTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [recorderSupported, setRecorderSupported] = useState(true)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<number | null>(null)

  // Recent Uploads State
  const [recentUploads, setRecentUploads] = useState<UploadedMedia[]>([])

  // Modal states
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewModalMedia, setPreviewModalMedia] = useState<UploadedMedia | null>(null)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renameModalMedia, setRenameModalMedia] = useState<UploadedMedia | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmMedia, setDeleteConfirmMedia] = useState<UploadedMedia | null>(null)

  // Check MediaRecorder support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
      setRecorderSupported(supported)
    }

    // Load recent uploads from localStorage
    const saved = localStorage.getItem('ai_study_hub_recent_media_uploads')
    if (saved) {
      try {
        setRecentUploads(JSON.parse(saved))
      } catch (e) {
        console.error('Error parsing recent media uploads:', e)
      }
    }
  }, [])

  // Smoothly animate simulated progress bar from 75% to 100% on mount for Document mode
  useEffect(() => {
    if (activeTab !== 'document' || !fileAttached || uploadComplete) return

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploadComplete(true)
          return 100
        }
        const next = prev + Math.floor(Math.random() * 8) + 2
        return next > 100 ? 100 : next
      })
    }, 450)

    return () => clearInterval(interval)
  }, [fileAttached, uploadComplete, activeTab])

  // Progress Bar Simulation for Audio and Video uploads
  useEffect(() => {
    if (activeTab === 'document' || !uploadedFile || uploadComplete) return

    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploadComplete(true)
          return 100
        }
        const next = prev + Math.floor(Math.random() * 18) + 6
        return next > 100 ? 100 : next
      })
    }, 150)

    return () => clearInterval(interval)
  }, [uploadedFile, uploadComplete, activeTab])

  // Recording Count-up Timer Hook
  useEffect(() => {
    if (isTimerRunning && recordingStatus === 'recording') {
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTimer((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [isTimerRunning, recordingStatus])

  // Cleanup blob urls on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && !recentUploads.some(u => u.url === previewUrl)) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl, recentUploads])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // MediaRecorder handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setPreviewUrl(url)
        
        const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        const recordingName = `Recording_${timestamp.substring(0, 10)}`
        setUploadedFile(new File([audioBlob], `${recordingName}.webm`, { type: 'audio/webm' }))
        setDocTitle(recordingName.replace('_', ' '))
        setRecordingStatus('stopped')
        setUploadComplete(true)
        setUploadProgress(100)
        toast.success(t.upload.recordingCompleted || 'Recording completed')
      }

      mediaRecorder.start()
      setRecordingStatus('recording')
      setRecordingTimer(0)
      setIsTimerRunning(true)
      toast.success(t.upload.recordingStarted || 'Recording started')
    } catch (err: any) {
      console.error('Error starting recording:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error(t.upload.permissionDenied || 'Microphone permission denied')
      } else {
        toast.error(t.upload.unsupportedFormat || 'Unsupported recording configuration')
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setRecordingStatus('paused')
      setIsTimerRunning(false)
      toast.success(t.upload.recordingPaused || 'Recording paused')
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setRecordingStatus('recording')
      setIsTimerRunning(true)
      toast.success(t.upload.recordingResumed || 'Recording resumed')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop()
      setIsTimerRunning(false)
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
    }
  }

  const deleteRecording = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setUploadedFile(null)
    setRecordingTimer(0)
    setIsTimerRunning(false)
    setRecordingStatus('idle')
    setDocTitle('')
    setDescription('')
    setSelectedTags([])
    toast.success(t.upload.recordingDeleted || 'Recording deleted')
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      processSelectedFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      processSelectedFile(files[0])
    }
  }

  const processSelectedFile = (file: File) => {
    if (activeTab === 'document') {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(language === 'en' ? 'Document size exceeds 50MB' : 'Dung lượng tài liệu học tập vượt quá 50MB!')
        return
      }
      setSelectedFile(file)
      setFileName(file.name)
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`)

      // Auto-detect type
      const ext = file.name.split('.').pop()?.toLowerCase()
      let detectedType: 'pdf' | 'word' | 'image' | 'text' | 'slides' = 'pdf'
      if (ext === 'pdf') detectedType = 'pdf'
      else if (ext === 'docx' || ext === 'doc') detectedType = 'word'
      else if (ext === 'txt') detectedType = 'text'
      else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') detectedType = 'image'
      else if (ext === 'pptx' || ext === 'ppt') detectedType = 'slides'

      setFileType(detectedType)
      setFileAttached(true)
      setUploadProgress(0)
      setUploadComplete(false)

      if (!docTitle.trim() || docTitle === 'Lecture_Notes_Week4') {
        const cleanName = file.name.split('.')[0].replace(/[_-]/g, ' ')
        setDocTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
      }
    } else if (activeTab === 'video') {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const allowed = ['mp4', 'mov', 'webm']
      if (!ext || !allowed.includes(ext)) {
        toast.error(t.upload.unsupportedFormat || 'Unsupported video format')
        return
      }
      if (file.size > 500 * 1024 * 1024) {
        toast.error(t.upload.videoSizeExceeds || 'Video size exceeds 500MB')
        return
      }

      setUploadedFile(file)
      setFileName(file.name)
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      
      const cleanName = file.name.split('.')[0].replace(/[_-]/g, ' ')
      setDocTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
      setUploadProgress(0)
      setUploadComplete(false)
      toast.success(t.upload.videoUploaded || 'Video uploaded successfully')
    } else if (activeTab === 'audio') {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const allowed = ['mp3', 'wav', 'm4a', 'webm']
      if (!ext || !allowed.includes(ext)) {
        toast.error(t.upload.unsupportedFormat || 'Unsupported audio format')
        return
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(t.upload.audioSizeExceeds || 'Audio size exceeds 100MB')
        return
      }

      setUploadedFile(file)
      setFileName(file.name)
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      
      const cleanName = file.name.split('.')[0].replace(/[_-]/g, ' ')
      setDocTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
      setUploadProgress(0)
      setUploadComplete(false)
      toast.success(t.upload.audioUploaded || 'Audio uploaded successfully')
    }
  }

  const handleBrowseFilesClick = () => {
    fileInputRef.current?.click()
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const getSubjectName = (key: string) => {
    if (key === 'COMPSCI') return t.myDocuments.compsci
    if (key === 'MATHEMATICS') return t.myDocuments.math
    if (key === 'BIOLOGY') return language === 'en' ? 'Molecular Biology' : (language === 'vi' ? 'Sinh học phân tử' : (language === 'ja' ? '分子生物学' : '분자생물학'))
    const subjectMap: Record<string, Record<string, string>> = {
      PHYSICS: { en: 'Physics', vi: 'Vật lý', ja: '物理学', ko: '물리학' },
      PHILOSOPHY: { en: 'Philosophy', vi: 'Triết học', ja: '哲学', ko: '철학' },
      ECONOMICS: { en: 'Economics', vi: 'Kinh tế học', ja: '経済学', ko: '경제학' },
      GENERAL: { en: 'General Studies', vi: 'Đại cương', ja: '一般教養', ko: '교양' }
    }
    return subjectMap[key]?.[language] || key
  }

  const getTagName = (tag: string) => {
    const tagMap: Record<string, Record<string, string>> = {
      'Notes': { en: 'Notes', vi: 'Ghi chú', ja: 'ノート', ko: '노트' },
      'Assignment': { en: 'Assignment', vi: 'Bài tập', ja: '課題', ko: '과제' },
      'Lecture': { en: 'Lecture', vi: 'Bài giảng', ja: '講義', ko: '강의' },
      'Midterm': { en: 'Midterm', vi: 'Giữa kỳ', ja: '中間試験', ko: '중간고사' },
      'Final Exam': { en: 'Final Exam', vi: 'Cuối kỳ', ja: '期末試験', ko: '기말고사' }
    }
    return tagMap[tag]?.[language] || tag
  }

  // Handle document tab submit (navigates away)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fileAttached) {
      toast.error(language === 'en' ? 'Please attach a study document first!' : 'Vui lòng đính kèm tài liệu học tập trước!')
      return
    }

    const finalTitle = docTitle.trim() || fileName.split('.')[0].replace(/_/g, ' ')
    setIsProcessing(true)

    setTimeout(() => {
      const finalFileName = selectedFile?.name || fileName
      const finalSize = selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : fileSize
      const finalSizeKb = selectedFile ? Math.round(selectedFile.size / 1024) : 4300

      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        title: finalTitle,
        fileName: finalFileName,
        uploadedAt: 'Uploaded Just Now',
        uploadedDateObj: new Date(),
        size: finalSize,
        sizeKb: finalSizeKb,
        subject: selectedSubjectKey,
        status: 'ANALYZED',
        type: fileType,
        essential: selectedTags.includes('Lecture') || selectedTags.includes('Midterm')
      }

      const savedDocsStr = localStorage.getItem('ai_study_hub_documents')
      let currentDocs: DocumentItem[] = savedDocsStr ? JSON.parse(savedDocsStr) : INITIAL_DOCUMENTS
      currentDocs = currentDocs.filter(d => d.id !== newDoc.id)
      const updatedDocs = [newDoc, ...currentDocs]

      localStorage.setItem('ai_study_hub_documents', JSON.stringify(updatedDocs))
      toast.success(t.toasts.uploadSuccess)
      setIsProcessing(false)
      navigate(`/dashboard/documents/subject/${selectedSubjectKey}`)
    }, 1200)
  }

  // Handle Video / Audio / Recording Save (adds to list locally without navigating)
  const handleSaveMedia = () => {
    const titleVal = docTitle.trim()
    if (!titleVal) {
      toast.error('Title is required')
      return
    }

    const finalSize = uploadedFile ? uploadedFile.size : 0
    const finalMime = uploadedFile ? uploadedFile.type : (activeTab === 'recording' ? 'audio/webm' : '')
    const finalFileName = uploadedFile ? uploadedFile.name : `recording-${Date.now()}.webm`

    const newMedia: UploadedMedia = {
      id: `media-${Date.now()}`,
      title: titleVal,
      type: activeTab,
      fileName: finalFileName,
      fileSize: finalSize,
      mimeType: finalMime,
      url: previewUrl || '',
      uploadedAt: 'Uploaded Just Now',
      description: description.trim(),
      tags: selectedTags
    }

    const updatedUploads = [newMedia, ...recentUploads]
    setRecentUploads(updatedUploads)
    localStorage.setItem('ai_study_hub_recent_media_uploads', JSON.stringify(updatedUploads))

    if (activeTab === 'video') {
      toast.success(t.upload.videoSaved || 'Video saved successfully')
    } else if (activeTab === 'audio') {
      toast.success(t.upload.audioSaved || 'Audio saved successfully')
    } else {
      toast.success(t.upload.recordingSaved || 'Recording saved successfully')
    }

    setUploadedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    setUploadComplete(false)
    setDocTitle('')
    setDescription('')
    setSelectedTags([])
    if (activeTab === 'recording') {
      setRecordingStatus('idle')
    }
  }

  const handleCancelMedia = () => {
    if (previewUrl && !recentUploads.some(u => u.url === previewUrl)) {
      URL.revokeObjectURL(previewUrl)
    }
    setUploadedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    setUploadComplete(false)
    setDocTitle('')
    setDescription('')
    setSelectedTags([])
    if (activeTab === 'recording') {
      setRecordingStatus('idle')
      setRecordingTimer(0)
      setIsTimerRunning(false)
    }
    toast.success('Upload discarded')
  }

  // Media Library Actions
  const handlePreviewClick = (item: UploadedMedia) => {
    setPreviewModalMedia(item)
    setPreviewModalOpen(true)
  }

  const handleDownloadClick = (item: UploadedMedia) => {
    try {
      const link = document.createElement('a')
      link.href = item.url
      link.download = item.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('File downloaded successfully')
    } catch (err) {
      toast.error('Download failed')
    }
  }

  const handleRenameClick = (item: UploadedMedia) => {
    setRenameModalMedia(item)
    setRenameTitle(item.title)
    setRenameModalOpen(true)
  }

  const confirmRename = () => {
    if (!renameModalMedia || !renameTitle.trim()) return
    const updated = recentUploads.map(item =>
      item.id === renameModalMedia.id ? { ...item, title: renameTitle.trim() } : item
    )
    setRecentUploads(updated)
    localStorage.setItem('ai_study_hub_recent_media_uploads', JSON.stringify(updated))
    setRenameModalOpen(false)
    setRenameModalMedia(null)
    toast.success('File renamed successfully')
  }

  const handleDeleteClick = (item: UploadedMedia) => {
    setDeleteConfirmMedia(item)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (!deleteConfirmMedia) return
    if (deleteConfirmMedia.url && deleteConfirmMedia.url.startsWith('blob:')) {
      URL.revokeObjectURL(deleteConfirmMedia.url)
    }
    const updated = recentUploads.filter(item => item.id !== deleteConfirmMedia.id)
    setRecentUploads(updated)
    localStorage.setItem('ai_study_hub_recent_media_uploads', JSON.stringify(updated))
    setDeleteConfirmOpen(false)
    setDeleteConfirmMedia(null)
    toast.success('File deleted successfully')
  }

  const renderPreviewFileIcon = () => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-6 w-6 stroke-[1.8] text-rose-500" />
      case 'word':
        return <FileCode className="h-6 w-6 stroke-[1.8] text-blue-500" />
      case 'text':
        return <BookOpen className="h-6 w-6 stroke-[1.8] text-emerald-500" />
      case 'image':
        return <ImageIcon className="h-6 w-6 stroke-[1.8] text-sky-500" />
      case 'slides':
      default:
        return <FileText className="h-6 w-6 stroke-[1.8] text-amber-500" />
    }
  }

  const TABS: { key: UploadType; label: string; icon: React.ReactNode }[] = [
    { key: 'document', label: t.upload.title || 'Document', icon: <FileCheck className="h-4 w-4" /> },
    { key: 'video', label: t.upload.uploadVideo || 'Video', icon: <Video className="h-4 w-4" /> },
    { key: 'audio', label: t.upload.uploadAudio || 'Audio', icon: <Music className="h-4 w-4" /> },
    { key: 'recording', label: t.upload.recordAudio || 'Record', icon: <Mic className="h-4 w-4" /> }
  ]

  return (
    <div className="space-y-5 pb-12 animate-fade-in max-w-[680px] mx-auto pt-2 px-4 md:px-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={
          activeTab === 'document'
            ? ".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.pptx,.ppt"
            : activeTab === 'video'
            ? ".mp4,.mov,.webm"
            : ".mp3,.wav,.m4a,.webm"
        }
      />

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-[28px] font-extrabold text-[#0B1A30] dark:text-slate-100 tracking-tight">
          Upload Workspace
        </h1>
        <p className="text-xs md:text-sm font-medium text-[#5F6E80] dark:text-slate-400">
          Upload documents, media, or record voice lectures. AI generates smart summaries & cards instantly.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAF1FB] dark:border-slate-800 overflow-x-auto scrollbar-none pb-2 select-none">
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (previewUrl && !recentUploads.some(u => u.url === previewUrl)) {
                  URL.revokeObjectURL(previewUrl)
                }
                setPreviewUrl(null)
                setUploadedFile(null)
                setFileAttached(false)
                setRecordingStatus('idle')
                setRecordingTimer(0)
                setIsTimerRunning(false)
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                  mediaRecorderRef.current.stop()
                }
                setActiveTab(tab.key)
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer shrink-0 border",
                isSelected
                  ? "bg-[#2563eb] border-[#2563eb] text-white"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Card Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#EAF1FB] dark:border-slate-800 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.012)] space-y-6">
          
          {/* 1. DOCUMENT TAB CONTENT */}
          {activeTab === 'document' && !fileAttached && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseFilesClick}
              className={cn(
                "flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed py-8 px-6 text-center min-h-[190px] transition-all duration-300 cursor-pointer",
                isDragOver
                  ? "border-[#2563eb] bg-blue-50/20 shadow-inner"
                  : "border-[#C3D2FF] bg-[#F4F7FF]/35 dark:bg-slate-950/20 hover:bg-[#F4F7FF]/55"
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FB] dark:bg-slate-800 text-[#2563eb] mb-3.5">
                <CloudUpload className="h-6 w-6 stroke-[1.8] text-[#2563eb]" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0B1A30] dark:text-slate-100 tracking-tight">
                {t.upload.dragDrop || 'Drag and drop your files here'}
              </h3>
              <p className="text-xs font-semibold text-[#8B98A5] mt-1">
                {t.upload.supportFormat || 'Support for PDF, DOCX, and PPTX files (Max 50MB)'}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleBrowseFilesClick()
                }}
                className="mt-5 rounded-xl border border-[#D5E1F2] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-[#2563eb] font-bold text-xs px-6 py-2.5 shadow-sm transition-all cursor-pointer hover:border-blue-200"
              >
                {t.upload.browse}
              </button>
            </div>
          )}

          {/* 2. VIDEO TAB CONTENT */}
          {activeTab === 'video' && !uploadedFile && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseFilesClick}
              className={cn(
                "flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed py-8 px-6 text-center min-h-[190px] transition-all duration-300 cursor-pointer",
                isDragOver
                  ? "border-[#2563eb] bg-blue-50/20 shadow-inner"
                  : "border-[#C3D2FF] bg-[#F4F7FF]/35 dark:bg-slate-950/20 hover:bg-[#F4F7FF]/55"
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FB] dark:bg-slate-800 text-[#2563eb] mb-3.5">
                <Video className="h-6 w-6 stroke-[1.8] text-[#2563eb]" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0B1A30] dark:text-slate-100 tracking-tight">
                {t.upload.videoDropzone || 'Drag and drop your video here'}
              </h3>
              <p className="text-xs font-semibold text-[#8B98A5] mt-1">
                {t.upload.videoSupport || 'Support for MP4, MOV, WEBM files (Max 500MB)'}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleBrowseFilesClick()
                }}
                className="mt-5 rounded-xl border border-[#D5E1F2] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-[#2563eb] font-bold text-xs px-6 py-2.5 shadow-sm transition-all cursor-pointer hover:border-blue-200"
              >
                {t.upload.browseVideo || 'Browse Video'}
              </button>
            </div>
          )}

          {/* 3. AUDIO TAB CONTENT */}
          {activeTab === 'audio' && !uploadedFile && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseFilesClick}
              className={cn(
                "flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed py-8 px-6 text-center min-h-[190px] transition-all duration-300 cursor-pointer",
                isDragOver
                  ? "border-[#2563eb] bg-blue-50/20 shadow-inner"
                  : "border-[#C3D2FF] bg-[#F4F7FF]/35 dark:bg-slate-950/20 hover:bg-[#F4F7FF]/55"
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FB] dark:bg-slate-800 text-[#2563eb] mb-3.5">
                <Music className="h-6 w-6 stroke-[1.8] text-[#2563eb]" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0B1A30] dark:text-slate-100 tracking-tight">
                {t.upload.audioDropzone || 'Drag and drop your audio file here'}
              </h3>
              <p className="text-xs font-semibold text-[#8B98A5] mt-1">
                {t.upload.audioSupport || 'Support for MP3, WAV, M4A, WEBM files (Max 100MB)'}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleBrowseFilesClick()
                }}
                className="mt-5 rounded-xl border border-[#D5E1F2] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-[#2563eb] font-bold text-xs px-6 py-2.5 shadow-sm transition-all cursor-pointer hover:border-blue-200"
              >
                {t.upload.browseAudio || 'Browse Audio'}
              </button>
            </div>
          )}

          {/* 4. RECORD TAB CONTENT */}
          {activeTab === 'recording' && (
            <div className="space-y-4">
              {recordingStatus === 'idle' && (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-[#F4F7FF]/35 dark:bg-slate-950/20 border border-[#EAF1FB] dark:border-slate-800 rounded-2xl p-6 min-h-[190px]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FB] dark:bg-slate-800 text-[#2563eb] mb-3.5 animate-pulse">
                    <Mic className="h-6 w-6 stroke-[1.8]" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0B1A30] dark:text-slate-100">
                    {t.upload.recordAudio || 'Record Audio'}
                  </h3>
                  {!recorderSupported ? (
                    <p className="text-xs font-semibold text-rose-500 mt-2">
                      Audio recording is not supported in this browser.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-[#8B98A5] mt-1">
                        Ready to record
                      </p>
                      <button
                        type="button"
                        onClick={startRecording}
                        className="mt-5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 shadow-sm transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Mic className="h-4 w-4" />
                        {t.upload.startRecording || 'Start Recording'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-[#F4F7FF]/35 dark:bg-slate-950/20 border border-[#EAF1FB] dark:border-slate-800 rounded-2xl p-6 min-h-[190px] select-none">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 mb-3.5 animate-ping">
                    <Mic className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black text-[#0B1A30] dark:text-slate-100" aria-live="polite">
                    {formatTime(recordingTimer)}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 capitalize animate-pulse" aria-live="polite">
                    {recordingStatus === 'recording' ? 'Recording...' : 'Recording paused'}
                  </p>
                  <div className="flex items-center gap-3 mt-6">
                    {recordingStatus === 'recording' ? (
                      <button
                        type="button"
                        onClick={pauseRecording}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-5 py-2 cursor-pointer flex items-center gap-1.5"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        {t.upload.pause || 'Pause'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={resumeRecording}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-5 py-2 cursor-pointer flex items-center gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5" />
                        {t.upload.resume || 'Resume'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2 cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t.upload.stop || 'Stop'}
                    </button>
                  </div>
                </div>
              )}

              {recordingStatus === 'stopped' && previewUrl && (
                <div className="space-y-4 animate-fade-in">
                  <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-[#EAF1FB] dark:border-slate-800">
                    <div className="text-xs font-bold text-[#5F6E80] dark:text-slate-400 mb-2">Recording Playback</div>
                    <audio controls src={previewUrl} className="w-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={deleteRecording}
                      className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs px-4 py-2 cursor-pointer"
                    >
                      Delete Recording
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Upload Card for Document/Video/Audio */}
          {activeTab !== 'recording' && (fileAttached || uploadedFile) && (
            <div className="rounded-xl bg-[#F0F4F9]/60 dark:bg-slate-800/40 p-5 shadow-none animate-fade-in select-none relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                    {activeTab === 'video' ? (
                      <Video className="h-6 w-6 text-indigo-500" />
                    ) : activeTab === 'audio' ? (
                      <Music className="h-6 w-6 text-emerald-500" />
                    ) : (
                      renderPreviewFileIcon()
                    )}
                  </div>
                  <span className="font-bold text-[#0B1A30] dark:text-slate-200 text-sm truncate pr-4" title={fileName}>
                    {fileName}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-[#2563eb] shrink-0">
                  {uploadProgress}%
                </span>
              </div>

              <div className="w-full bg-[#EAF1FB] dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    uploadComplete ? "bg-emerald-500" : "bg-[#2563eb]"
                  )}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              {/* Reset Upload Cancel Trigger */}
              {!uploadComplete && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'document') {
                      setFileAttached(false)
                      setSelectedFile(null)
                    } else {
                      handleCancelMedia()
                    }
                  }}
                  className="absolute top-3 right-3 rounded-full p-1 text-slate-400 hover:bg-slate-200/55 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                  aria-label="Cancel upload"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Media Player Previews for completed Video & Audio */}
          {uploadComplete && uploadedFile && (
            <div className="space-y-4 animate-fade-in border-b border-[#EAF1FB] dark:border-slate-800 pb-6">
              {activeTab === 'video' && (
                <div className="space-y-4">
                  <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-2xl p-2 border border-[#EAF1FB] dark:border-slate-800">
                    <video controls src={previewUrl || ''} className="w-full rounded-xl max-h-[300px]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleBrowseFilesClick}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2 cursor-pointer"
                    >
                      Replace Video
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelMedia}
                      className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs px-4 py-2 cursor-pointer"
                    >
                      Remove Video
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="space-y-4">
                  <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-[#EAF1FB] dark:border-slate-800">
                    <audio controls src={previewUrl || ''} className="w-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleBrowseFilesClick}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2 cursor-pointer"
                    >
                      Replace Audio
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelMedia}
                      className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs px-4 py-2 cursor-pointer"
                    >
                      Remove Audio
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields Stack: Visible for Document if attached, OR for Video/Audio/Record if upload is complete */}
          {((activeTab === 'document' && fileAttached) || (activeTab !== 'document' && (uploadedFile && uploadComplete))) && (
            <div className="space-y-6 pt-4 animate-fade-in">
              {/* Type Read-only */}
              {activeTab !== 'document' && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#5F6E80] dark:text-slate-400 select-none">
                    Type
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-[#EAF1FB] dark:border-slate-800 bg-[#F0F4F9]/60 dark:bg-slate-800/40 px-4 py-3 text-sm text-[#0B1A30] dark:text-slate-200 font-semibold select-none capitalize">
                    <span>{activeTab === 'recording' ? 'Recording' : activeTab}</span>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-2">
                <label htmlFor="upload-title" className="block text-sm font-bold text-[#5F6E80] select-none dark:text-slate-400">
                  {t.upload.docTitle}
                </label>
                <input
                  id="upload-title"
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder={t.upload.placeholderTitle}
                  disabled={isProcessing}
                  required
                  className="w-full rounded-xl border border-transparent bg-[#F0F4F9]/60 hover:bg-[#F0F4F9]/80 focus:bg-white focus:border-[#2563eb] focus:outline-none transition-all px-4 py-3 text-sm font-semibold text-[#0B1A30] placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                />
              </div>

              {/* Subject Dropdown Select */}
              <div className="space-y-2">
                <label htmlFor="upload-subject" className="block text-sm font-bold text-[#5F6E80] select-none dark:text-slate-400">
                  {t.myDocuments.subject}
                </label>
                <div className="relative">
                  <select
                    id="upload-subject"
                    value={selectedSubjectKey}
                    onChange={(e) => setSelectedSubjectKey(e.target.value as any)}
                    disabled={isProcessing}
                    className="w-full appearance-none rounded-xl border border-transparent bg-[#F0F4F9]/60 hover:bg-[#F0F4F9]/80 focus:bg-white focus:border-[#2563eb] focus:outline-none transition-all px-4 py-3 text-sm font-semibold text-[#0B1A30] cursor-pointer dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                  >
                    <option value="COMPSCI">{getSubjectName('COMPSCI')}</option>
                    <option value="MATHEMATICS">{getSubjectName('MATHEMATICS')}</option>
                    <option value="BIOLOGY">{getSubjectName('BIOLOGY')}</option>
                    <option value="PHYSICS">{getSubjectName('PHYSICS')}</option>
                    <option value="PHILOSOPHY">{getSubjectName('PHILOSOPHY')}</option>
                    <option value="ECONOMICS">{getSubjectName('ECONOMICS')}</option>
                    <option value="GENERAL">{getSubjectName('GENERAL')}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#5F6E80] dark:text-slate-455">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Description Textarea */}
              <div className="space-y-2">
                <label htmlFor="upload-desc" className="block text-sm font-bold text-[#5F6E80] select-none dark:text-slate-400">
                  {t.upload.description}
                </label>
                <textarea
                  id="upload-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.upload.placeholderDesc}
                  disabled={isProcessing}
                  className="w-full rounded-xl border border-transparent bg-[#F0F4F9]/60 hover:bg-[#F0F4F9]/80 focus:bg-white focus:border-[#2563eb] focus:outline-none transition-all px-4 py-3 text-sm font-semibold text-[#0B1A30] placeholder:text-slate-400 min-h-[100px] resize-none dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                />
              </div>

              {/* Tags Pills Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#5F6E80] select-none dark:text-slate-400">
                  {t.upload.tags}
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        disabled={isProcessing}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-xs font-bold border transition-all duration-200 focus:outline-none cursor-pointer disabled:opacity-50",
                          isSelected
                            ? "bg-[#2563eb] border-[#2563eb] text-white shadow-sm shadow-blue-500/10"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        {getTagName(tag)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Document specific Visibility / AI configuration */}
              {activeTab === 'document' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#5F6E80] select-none dark:text-slate-400">
                        {t.upload.fileType}
                      </label>
                      <div className="flex items-center gap-2 rounded-xl border border-[#EAF1FB] bg-white px-4 py-3 text-sm text-slate-700 font-semibold select-none dark:bg-slate-800 dark:border-slate-800 dark:text-slate-205">
                        <FileText className="h-4.5 w-4.5 text-[#5F6E80] dark:text-slate-400" />
                        <span>{t.upload.autoDetected}: {fileType.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#5F6E80] select-none dark:text-slate-400">
                        {t.upload.visibility}
                      </label>
                      <div className="flex items-center gap-4 h-[46px]">
                        <label className="relative flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="visibility"
                            value="private"
                            checked={visibility === 'private'}
                            onChange={() => setVisibility('private')}
                            disabled={isProcessing}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                          />
                          <div className="relative flex items-center justify-center">
                            <div className={cn(
                              "h-4.5 w-4.5 rounded-full border bg-white transition-all duration-200",
                              visibility === 'private' ? "border-[#2563eb] ring-2 ring-blue-50" : "border-slate-300"
                            )} />
                            <div className={cn(
                              "absolute h-2.5 w-2.5 rounded-full bg-[#2563eb] transition-all duration-200 scale-0",
                              visibility === 'private' && "scale-100"
                            )} />
                          </div>
                          <span className={cn(
                            "text-sm font-bold transition-colors duration-200",
                            visibility === 'private' ? "text-[#2563eb]" : "text-[#5F6E80]"
                          )}>
                            {t.upload.private}
                          </span>
                        </label>

                        <label className="relative flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="visibility"
                            value="shared"
                            checked={visibility === 'shared'}
                            onChange={() => setVisibility('shared')}
                            disabled={isProcessing}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                          />
                          <div className="relative flex items-center justify-center">
                            <div className={cn(
                              "h-4.5 w-4.5 rounded-full border bg-white transition-all duration-200",
                              visibility === 'shared' ? "border-[#2563eb] ring-2 ring-blue-50" : "border-slate-300"
                            )} />
                            <div className={cn(
                              "absolute h-2.5 w-2.5 rounded-full bg-[#2563eb] transition-all duration-200 scale-0",
                              visibility === 'shared' && "scale-100"
                            )} />
                          </div>
                          <span className={cn(
                            "text-sm font-bold transition-colors duration-200",
                            visibility === 'shared' ? "text-[#2563eb]" : "text-[#5F6E80]"
                          )}>
                            {t.upload.shared}
                          </span>
                        </label>

                        <label className="relative flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="visibility"
                            value="public"
                            checked={visibility === 'public'}
                            onChange={() => setVisibility('public')}
                            disabled={isProcessing}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                          />
                          <div className="relative flex items-center justify-center">
                            <div className={cn(
                              "h-4.5 w-4.5 rounded-full border bg-white transition-all duration-200",
                              visibility === 'public' ? "border-[#2563eb] ring-2 ring-blue-50" : "border-slate-300"
                            )} />
                            <div className={cn(
                              "absolute h-2.5 w-2.5 rounded-full bg-[#2563eb] transition-all duration-200 scale-0",
                              visibility === 'public' && "scale-100"
                            )} />
                          </div>
                          <span className={cn(
                            "text-sm font-bold transition-colors duration-200",
                            visibility === 'public' ? "text-[#2563eb]" : "text-[#5F6E80]"
                          )}>
                            {t.upload.public}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#2563eb] animate-pulse" />
                      <h3 className="text-base font-extrabold text-[#0B1A30] tracking-tight select-none dark:text-slate-100">
                        {t.upload.aiProcessing}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl border p-4 transition-all cursor-pointer select-none bg-white dark:bg-slate-900",
                          generateSummary
                            ? "border-blue-100 bg-[#F4F7FF]/30 shadow-xs dark:border-blue-900/30"
                            : "border-slate-200 hover:bg-slate-50/50 dark:border-slate-800"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={generateSummary}
                          onChange={(e) => setGenerateSummary(e.target.checked)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                          disabled={isProcessing}
                        />
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                            generateSummary
                              ? "border-[#2563eb] bg-[#2563eb] text-white"
                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          )}
                        >
                          {generateSummary && (
                            <svg
                              className="h-3.5 w-3.5 stroke-[3] stroke-current"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-bold text-[#0B1A30] dark:text-slate-200">
                          {t.upload.genSummary}
                        </span>
                      </label>

                      <label
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl border p-4 transition-all cursor-pointer select-none bg-white dark:bg-slate-900",
                          createFlashcards
                            ? "border-blue-100 bg-[#F4F7FF]/30 shadow-xs dark:border-blue-900/30"
                            : "border-slate-200 hover:bg-slate-50/50 dark:border-slate-800"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={createFlashcards}
                          onChange={(e) => setCreateFlashcards(e.target.checked)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                          disabled={isProcessing}
                        />
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                            createFlashcards
                              ? "border-[#2563eb] bg-[#2563eb] text-white"
                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          )}
                        >
                          {createFlashcards && (
                            <svg
                              className="h-3.5 w-3.5 stroke-[3] stroke-current"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-bold text-[#0B1A30] dark:text-slate-200">
                          {t.upload.createFlashcards}
                        </span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'document') {
                      navigate('/dashboard/documents')
                    } else {
                      handleCancelMedia()
                    }
                  }}
                  disabled={isProcessing}
                  className="rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-xs px-6 h-[44px] cursor-pointer transition-all disabled:opacity-50 text-sm"
                >
                  {t.upload.cancel}
                </button>
                
                {activeTab === 'document' ? (
                  <button
                    type="submit"
                    disabled={isProcessing || !fileAttached}
                    className="group flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 px-6 h-[44px] cursor-pointer transition-all duration-200 disabled:opacity-50 text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {t.upload.processing}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {t.upload.processAI}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveMedia}
                    className="group flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 px-6 h-[44px] cursor-pointer transition-all duration-200 text-sm"
                  >
                    <FileCheck className="h-4 w-4" />
                    {activeTab === 'video' ? 'Save Video' : activeTab === 'audio' ? 'Save Audio' : 'Save Recording'}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </form>

      {/* MEDIA LIBRARY: RECENT UPLOADS */}
      <div className="bg-white dark:bg-slate-900 border border-[#EAF1FB] dark:border-slate-800 rounded-[22px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.012)] select-none">
        <h2 className="text-lg font-extrabold text-[#0B1A30] dark:text-slate-100 mb-4 flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-500" />
          {t.upload.recentUploads || 'Recent Uploads'}
        </h2>
        
        {recentUploads.length === 0 ? (
          <div className="text-center py-8 text-[#8B98A5] dark:text-slate-500 font-semibold text-sm">
            {t.upload.noRecentUploads || 'No recent uploads'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-[#EAF1FB] dark:border-slate-800 text-xs font-bold text-[#5F6E80] dark:text-slate-400">
                  <th className="pb-3 pr-4">{t.upload.docTitle || 'Title'}</th>
                  <th className="pb-3 px-4">{t.upload.fileType || 'Type'}</th>
                  <th className="pb-3 px-4">Size</th>
                  <th className="pb-3 px-4">Uploaded</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF1FB] dark:divide-slate-800">
                {recentUploads.map((item) => (
                  <tr key={item.id} className="text-[#0B1A30] dark:text-slate-200">
                    <td className="py-4 pr-4 font-bold max-w-[200px] truncate" title={item.title}>
                      <div className="flex items-center gap-2">
                        {item.type === 'video' ? (
                          <Video className="h-4 w-4 text-indigo-500 shrink-0" />
                        ) : item.type === 'audio' || item.type === 'recording' ? (
                          <Music className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                        )}
                        <span className="truncate">{item.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold capitalize">{item.type}</td>
                    <td className="py-4 px-4 text-[#5F6E80] dark:text-slate-400 font-semibold">
                      {item.fileSize > 0 ? `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-[#5F6E80] dark:text-slate-400 font-medium">
                      {item.uploadedAt}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handlePreviewClick(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563eb] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title={t.upload.preview || 'Preview'}
                          aria-label={t.upload.preview || 'Preview'}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadClick(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title={t.upload.download || 'Download'}
                          aria-label={t.upload.download || 'Download'}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRenameClick(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title={t.upload.rename || 'Rename'}
                          aria-label={t.upload.rename || 'Rename'}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors cursor-pointer"
                          title={t.upload.delete || 'Delete'}
                          aria-label={t.upload.delete || 'Delete'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OVERLAY MODALS */}
      {/* 1. Preview Modal */}
      {previewModalOpen && previewModalMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer" onClick={() => setPreviewModalOpen(false)} />
          <div className="relative z-10 w-full max-w-[640px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate pr-4 max-w-[500px]">
                {previewModalMedia.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="w-full flex justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-2 border border-slate-100 dark:border-slate-850">
              {previewModalMedia.type === 'video' ? (
                <video controls src={previewModalMedia.url} className="w-full max-h-[360px] rounded-xl" autoPlay />
              ) : (
                <audio controls src={previewModalMedia.url} className="w-full py-4 px-2" autoPlay />
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="bg-[#2563eb] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Rename Modal */}
      {renameModalOpen && renameModalMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer" onClick={() => setRenameModalOpen(false)} />
          <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.upload.rename || 'Rename File'}
            </h3>
            <div className="space-y-2">
              <label htmlFor="rename-input" className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                {t.upload.docTitle || 'Title'}
              </label>
              <input
                id="rename-input"
                type="text"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRenameModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all duration-200 cursor-pointer"
              >
                {t.upload.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmRename}
                disabled={!renameTitle.trim()}
                className="bg-[#2563eb] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md disabled:opacity-50"
              >
                {t.upload.saveRecording || 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {deleteConfirmOpen && deleteConfirmMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-left">
            <div className="flex gap-3 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.upload.delete || 'Delete'} "{deleteConfirmMedia.title}"?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 font-semibold leading-relaxed">
                  Are you sure you want to permanently remove this media file? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all duration-200 cursor-pointer"
              >
                {t.upload.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md"
              >
                {t.upload.delete || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default UploadPage
