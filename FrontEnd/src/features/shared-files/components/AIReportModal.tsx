import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, AlertCircle, Trash2, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { apiClient } from '@/lib/axios'
import { useToast } from '@/components/ui/Toast'

interface AIReportModalProps {
  isOpen: boolean
  onClose: () => void
  onOptimized: () => void
}

export function AIReportModal({ isOpen, onClose, onOptimized }: AIReportModalProps) {
  const { t, language } = useTranslation()
  const toast = useToast()
  
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      const fetchDuplicates = async () => {
        setLoading(true)
        try {
          const res = await apiClient.get('/shared-files/duplicates')
          setDuplicates(res.data)
        } catch (err) {
          console.error("Failed to fetch duplicates", err)
        } finally {
          setLoading(false)
        }
      }
      fetchDuplicates()
    }
  }, [isOpen])

  const handleOptimize = async () => {
    const nonOriginals = duplicates
      .filter(d => d.matchType !== 'original')
      .map(d => d.id)
    if (nonOriginals.length === 0) {
      onClose()
      return
    }

    setOptimizing(true)
    try {
      await apiClient.post('/shared-files/optimize', nonOriginals)
      const msg = language === 'vi' 
        ? 'Đã tối ưu hóa không gian làm việc AI thành công' 
        : (language === 'ja' 
          ? 'AIワークスペースの最適化に成功しました' 
          : (language === 'ko' 
            ? 'AI 워크스페이스가 성공적으로 최적화되었습니다' 
            : 'AI Workspace optimized successfully'))
      toast.success(msg)
      onOptimized()
    } catch (err) {
      console.error("Failed to optimize workspace", err)
      toast.error(language === 'vi' ? 'Tối ưu hóa thất bại' : 'Optimization failed')
    } finally {
      setOptimizing(false)
    }
  }

  const parseSizeToBytes = (sizeStr: string): number => {
    const num = parseFloat(sizeStr)
    if (isNaN(num)) return 0
    const lower = sizeStr.toLowerCase()
    if (lower.includes('gb')) return num * 1024 * 1024 * 1024
    if (lower.includes('mb')) return num * 1024 * 1024
    if (lower.includes('kb')) return num * 1024
    return num
  }

  const duplicateFiles = duplicates.filter(d => d.matchType !== 'original')
  const duplicatesCount = duplicateFiles.length
  
  const totalRedundantBytes = duplicateFiles.reduce((acc, file) => acc + parseSizeToBytes(file.size), 0)
  const totalRedundantMB = (totalRedundantBytes / (1024 * 1024)).toFixed(1)

  const getDynamicDescription = () => {
    if (language === 'vi') {
      return `Phát hiện ${duplicatesCount} tệp có cấu trúc giống nhau trong thư mục chia sẻ, chiếm thêm ${totalRedundantMB} MB dung lượng.`
    } else if (language === 'ja') {
      return `共有フォルダ内に同一構造のファイルが${duplicatesCount}つ見つかりました。追加で${totalRedundantMB}MBの容量を消費しています。`
    } else if (language === 'ko') {
      return `공유 폴더 내에서 구조가 동일한 파일 ${duplicatesCount}개가 발견되어 ${totalRedundantMB}MB의 용량을 추가로 소모하고 있습니다.`
    } else {
      return `Found ${duplicatesCount} files with identical structures inside the shared folder, consuming an extra ${totalRedundantMB} MB of space.`
    }
  }

  const getDynamicRecommendation = () => {
    if (language === 'vi') {
      return `Khuyến nghị giữ lại các tệp gốc và dọn dẹp ${duplicatesCount} tệp trùng lặp để giải phóng ${totalRedundantMB} MB dung lượng chia sẻ.`
    } else if (language === 'ja') {
      return `元のファイルを保持し、残りの${duplicatesCount}つの重複ファイルを削除して、共有スペースの${totalRedundantMB}MBを解放することをお勧めします。`
    } else if (language === 'ko') {
      return `원본 파일을 유지하고 나머지 ${duplicatesCount}개의 중복 파일을 정리하여 공유 공간 ${totalRedundantMB}MB를 확보하는 것을 권장합니다.`
    } else {
      return `We recommend keeping the original files and purging the ${duplicatesCount} redundant duplicates to free up ${totalRedundantMB} MB of shared space.`
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#060c18]/45 dark:bg-black/75 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-[28px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-7 shadow-2xl text-left backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
          >
            {/* Elegant Background Glow Blobs */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

            {/* Absolute Close button with hover animation */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200 cursor-pointer active:scale-90"
              aria-label="Close dialog"
              disabled={optimizing}
            >
              <X className="size-4.5" />
            </button>

            {/* Header */}
            <div className="flex gap-4 items-center mb-6 pb-4.5 border-b border-slate-100/80 dark:border-slate-800/80 relative">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 text-indigo-650 dark:text-indigo-400 shrink-0 border border-indigo-500/20 shadow-inner">
                <Sparkles className="size-5.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 id="report-title" className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  {t.aiGuardReport.aiGuardReport}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100/20">
                    AI Active
                  </span>
                </h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-0.5 leading-snug">
                  {t.aiGuardReport.redundancyReportSubtitle}
                </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="space-y-6 relative">
              {/* Biological Redundancy Alert Banner */}
              {duplicatesCount > 0 && (
                <div className="relative overflow-hidden flex items-start gap-3.5 bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:from-amber-955/15 dark:to-orange-955/10 border border-amber-200/50 dark:border-amber-900/20 p-4 rounded-2xl shadow-xs">
                  {/* Visual Left Accent Strip */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r" />
                  
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/10">
                    <AlertCircle className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-900 dark:text-amber-450 uppercase tracking-wider">
                      {language === 'vi' ? 'Phát hiện trùng lặp' : (language === 'ja' ? '重複の検出' : (language === 'ko' ? '중복 감지' : 'Redundancy Detected'))}
                    </h4>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 font-bold leading-relaxed mt-1">
                      {getDynamicDescription()}
                    </p>
                  </div>
                </div>
              )}

              {/* Duplicates list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                    {t.aiGuardReport.redundantFileGroups}
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-450 dark:text-slate-500">
                    {loading ? '...' : `${duplicates.length} ${language === 'vi' ? 'tệp quét được' : 'files found'}`}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="size-7 text-indigo-600 animate-spin" />
                    </div>
                  ) : duplicates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2.5">
                        <CheckCircle2 className="size-5" />
                      </div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {language === 'vi' ? 'Không gian làm việc đã được tối ưu hóa' : (language === 'ja' ? 'ワークスペースは最適化されています' : (language === 'ko' ? '워크스페이스가 최적화되었습니다' : 'Workspace is fully optimized'))}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-bold max-w-[280px]">
                        {language === 'vi' ? 'Không tìm thấy tệp tin trùng lặp nào cần dọn dẹp.' : (language === 'ja' ? 'クリーンアップが必要な重複ファイルはありません。' : (language === 'ko' ? '정리가 필요한 중복 파일이 없습니다.' : 'No duplicate files found to clean up.'))}
                      </p>
                    </div>
                  ) : (
                    duplicates.map((file, i) => {
                      const isOriginal = file.matchType === 'original'
                      return (
                        <div
                          key={i}
                          className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/20 dark:hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:shadow-slate-100/50 dark:hover:shadow-none transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="min-w-0 flex-1 mr-3 flex items-center gap-3">
                            {/* File Icon with dynamic colors */}
                            <div className={`flex size-9 items-center justify-center rounded-xl shrink-0 border ${
                              isOriginal
                                ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                              {isOriginal ? <CheckCircle2 className="size-4.5" /> : <FileText className="size-4.5" />}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {file.name}
                              </h4>
                              <p className="text-[10px] text-slate-550 dark:text-slate-400 font-bold mt-0.5">
                                {file.size} &bull; {file.dateKey === 'shared2hAgo' ? t.aiGuardReport.shared2hAgo : file.dateKey === 'sharedYesterday' ? t.aiGuardReport.sharedYesterday : t.aiGuardReport.sharedOct15}
                              </p>
                            </div>
                          </div>

                          {/* Elegant floating badge */}
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wide shrink-0 border transition-all duration-300 ${
                            isOriginal
                              ? 'bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-550'
                              : 'bg-rose-50/80 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-550'
                          }`}>
                            {isOriginal ? t.aiGuardReport.original : file.matchType === 'match99' ? t.aiGuardReport.match99 : t.aiGuardReport.match95}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* AI Recommendation Quote Bubble */}
              <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500/5 to-violet-500/5 dark:from-indigo-500/10 dark:to-violet-500/10 p-4 rounded-2xl border-l-[3px] border-indigo-500/80 shadow-inner">
                <div className="flex gap-2.5 items-start">
                  <div className="text-[11px] text-slate-650 dark:text-slate-355 font-bold leading-relaxed">
                    <span className="inline-flex items-center gap-1 font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider text-[10px] mr-1.5">
                      💡 {t.aiGuardReport.aiRecommendation}
                    </span>
                    <span className="italic">
                      {duplicatesCount > 0 
                        ? getDynamicRecommendation() 
                        : (language === 'vi' 
                          ? 'Dung lượng và tài liệu của không gian làm việc đang ở trạng thái tốt nhất.' 
                          : 'Your workspace files and storage limits are currently optimized.')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-6 shrink-0 relative">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 dark:hover:text-white text-xs font-extrabold transition-all duration-200 cursor-pointer active:scale-95"
                disabled={optimizing}
              >
                {t.aiGuardReport.cancel}
              </button>
              
              <button
                type="button"
                onClick={handleOptimize}
                className="bg-gradient-to-r from-indigo-600 via-indigo-550 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer border border-indigo-500/20 hover:border-indigo-600/30 disabled:opacity-50"
                disabled={optimizing || duplicatesCount === 0 || loading}
              >
                {optimizing ? (
                  <Loader2 className="size-4 animate-spin shrink-0" />
                ) : (
                  <Trash2 className="size-4 shrink-0" />
                )}
                <span>{t.aiGuardReport.applyOptimization}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AIReportModal
