import { ArrowLeft, FileText, Loader2, Video, Archive } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { env } from '@/config/env'
import { useTranslation } from '@/context/LanguageContext'
import { storageService, type StorageUsage } from '@/services/storageService'
import { useToast } from '@/components/ui/Toast'
import { getStorageLimitByPlan } from '@/constants/storagePlans'
import { formatStorageSize, calculateStorageUsage } from '@/utils/storageFormat'

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
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-950/40'
  },
  {
    id: '5',
    name: 'Raw_Data_Archive.zip',
    size: '1.2 GB',
    modified: 'Modified 1 year ago',
    icon: Archive,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950/40'
  }
]

export function StorageCleanupPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const isPro = user?.plan === 'pro'

  const [duplicates, setDuplicates] = useState(INITIAL_DUPLICATES)
  const [largeFiles, setLargeFiles] = useState(DEEP_ANALYSIS_FILES)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [usage, setUsage] = useState<StorageUsage | null>(null)
  const [reclaimedInfo, setReclaimedInfo] = useState({ files: 0, spaceMb: 0 })

  const fetchUsage = () => {
    if (user?.id) {
      storageService.getStorageUsage(Number(user.id))
        .then(data => {
          setUsage(data)
        })
        .catch(err => {
          console.error("Failed to fetch storage usage:", err)
        })
    }
  }

  useEffect(() => {
    fetchUsage()
  }, [user?.id])

  const totalFilesFound = hasAnalyzed ? 0 : 24
 
  const handleRemove = (id: string) => {
    setDuplicates(prev => prev.filter(item => item.id !== id))
  }
 
  const handleRemoveLarge = (id: string) => {
    setLargeFiles(prev => prev.filter(item => item.id !== id))
  }
 
  const handleAnalyze = async () => {
    if (!user?.id) return
    setIsAnalyzing(true)
    try {
      const dupResult = await storageService.runDuplicateCleanup(Number(user.id))
      const largeResult = await storageService.runLargeCleanup(Number(user.id), 10)
      
      const totalFiles = dupResult.filesFound + largeResult.filesFound
      const totalSpace = dupResult.spaceReclaimedMb + largeResult.spaceReclaimedMb
      
      setReclaimedInfo({ files: totalFiles, spaceMb: totalSpace })
      setHasAnalyzed(true)
      setDuplicates([])
      setLargeFiles([])
      
      // Refresh storage usage
      const newUsage = await storageService.getStorageUsage(Number(user.id))
      setUsage(newUsage)
      
      if (totalFiles > 0) {
        toast.success(`Dọn dẹp hoàn tất! Đã giải phóng ${totalSpace.toFixed(1)} MB từ ${totalFiles} tệp tin.`);
      } else {
        toast.success("Kho lưu trữ của bạn đã được tối ưu hóa, không phát hiện tệp tin thừa.");
      }
    } catch (err) {
      console.error(err)
      toast.error("Có lỗi xảy ra trong quá trình dọn dẹp kho lưu trữ.")
    } finally {
      setIsAnalyzing(false)
    }
  }
 
  const totalMb = usage ? usage.storageLimitMb : getStorageLimitByPlan(user?.plan)
  const totalGB = totalMb / 1024

  const usedMb = usage
    ? usage.storageUsedMb
    : user?.plan === 'pro'
      ? 2457.6
      : ((user?.plan as string) === 'premium' || (user?.plan as string) === 'institutional' || (user?.plan as string) === 'enterprise')
        ? 8192
        : 8

  const usedGB = usedMb / 1024
  const usageInfo = calculateStorageUsage(usedMb, totalMb)
  const percentage = usageInfo.percentage

  const displayUsedGB = parseFloat(usedGB.toFixed(3))
  const displayTotalGB = parseFloat(totalGB.toFixed(1))

  const getLocalizedModified = (modified: string) => {
    if (modified.includes('2 days ago')) return t.storageCleanup.modified2d
    if (modified.includes('1 week ago')) return t.storageCleanup.modified1w
    if (modified.includes('3 weeks ago')) return t.storageCleanup.modified3w
    if (modified.includes('6 months ago')) return t.storageCleanup.modified6m
    if (modified.includes('1 year ago')) return t.storageCleanup.modified1y
    return modified
  }
 
  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
      <div>
        <Link 
          to="/dashboard/storage" 
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t.storageCleanup.backToStorage}
        </Link>
        <div>
          <h1 className="text-[32px] font-bold text-foreground leading-tight">{t.storageCleanup.title}</h1>
          <p className="text-muted mt-2 text-sm">
            {t.storageCleanup.subtitle}
          </p>
        </div>
      </div>
 
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column */}
        <div className="flex-1 flex flex-col w-full gap-6">
          <Card className="border-border shadow-sm">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">{t.storageCleanup.duplicateFiles}</h2>
              <span className="text-sm font-medium text-muted">{t.storageCleanup.filesFound(totalFilesFound)}</span>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                {duplicates.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#eff6ff] dark:bg-blue-950/40 rounded-lg flex items-center justify-center shrink-0">
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
                        <span className="text-[12px] text-muted mt-0.5">{file.size} • {getLocalizedModified(file.modified)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemove(file.id)}
                      className="text-[#ef4444] text-[13px] font-semibold hover:text-red-600 px-3 py-1.5 transition-colors"
                    >
                      {t.storageCleanup.remove}
                    </button>
                  </div>
                ))}
                {duplicates.length === 0 && (
                  <div className="text-center text-sm text-muted py-8">
                    {t.storageCleanup.noDuplicates}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
 
          {hasAnalyzed && (
            <Card className="border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-bold text-foreground">{t.storageCleanup.largeUnusedFiles}</h2>
                <span className="text-sm font-medium text-muted">{t.storageCleanup.filesFound(largeFiles.length)}</span>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  {largeFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${file.bg} rounded-lg flex items-center justify-center shrink-0`}>
                          <file.icon className={`size-6 ${file.color}`} strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[15px] text-foreground">{file.name}</span>
                          <span className="text-[12px] text-muted mt-0.5">{file.size} • {getLocalizedModified(file.modified)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveLarge(file.id)}
                        className="text-[#ef4444] text-[13px] font-semibold hover:text-red-600 px-3 py-1.5 transition-colors"
                      >
                        {t.storageCleanup.remove}
                      </button>
                    </div>
                  ))}
                  {largeFiles.length === 0 && (
                    <div className="text-center text-sm text-muted py-8">
                      {t.storageCleanup.noLargeFiles}
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
            <h3 className="text-[17px] font-bold text-foreground mb-6">{t.storageCleanup.storageSummary}</h3>
            
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-muted">{t.storageCleanup.usedSpace}</span>
                <span className="text-sm font-bold text-foreground">{t.storageCleanup.usedOfText(displayUsedGB, displayTotalGB)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1d4ed8] rounded-full transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
 
            <p className="text-sm text-muted mb-6 leading-relaxed">
              {hasAnalyzed 
                ? `Đã giải phóng thành công ${reclaimedInfo.spaceMb.toFixed(1)} MB từ ${reclaimedInfo.files} tệp tin.`
                : t.storageCleanup.freeUpText(isPro ? '1.2 GB' : '0.4 GB')}
            </p>
 
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || hasAnalyzed}
              className={`w-full h-[42px] text-sm font-medium transition-colors ${
                hasAnalyzed 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-[#1e293b] hover:bg-[#0f172a] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 text-white'
              }`}
            >
              {isAnalyzing && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isAnalyzing ? t.storageCleanup.analyzingSpace : hasAnalyzed ? t.storageCleanup.analysisComplete : t.storageCleanup.analyzeDeeply}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
