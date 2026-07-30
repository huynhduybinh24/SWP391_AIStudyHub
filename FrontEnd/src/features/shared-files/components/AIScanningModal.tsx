import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface AIScanningModalProps {
  isOpen: boolean
  onClose: () => void
  fileName?: string
  language?: string
}

export const AIScanningModal: React.FC<AIScanningModalProps> = ({
  isOpen,
  onClose,
  fileName = 'Tài liệu mới',
  language = 'vi'
}) => {
  const [progress, setProgress] = useState(5)
  const [stepMsg, setStepMsg] = useState('Establishing secure connection...')

  const isVi = language === 'vi'

  useEffect(() => {
    if (!isOpen) {
      setProgress(5)
      setStepMsg(isVi ? 'Đang thiết lập kết nối an toàn...' : 'Establishing secure connection...')
      return
    }

    let currentVal = 5
    const interval = setInterval(() => {
      currentVal += Math.floor(Math.random() * 8) + 3
      if (currentVal >= 90) {
        currentVal = 90
        setStepMsg(isVi ? 'Đang chờ phân tích AI hoàn tất...' : 'Waiting for AI analysis to complete...')
        clearInterval(interval)
      } else {
        if (currentVal < 35) {
          setStepMsg(isVi ? 'Đang tải file lên lưu trữ đám mây...' : 'Uploading file to cloud storage...')
        } else if (currentVal < 65) {
          setStepMsg(isVi ? 'Đang trích xuất nội dung tệp...' : 'Extracting text content...')
        } else {
          setStepMsg(isVi ? 'Đang chạy phân tích kiểm duyệt AI...' : 'Running AI semantic analysis...')
        }
      }
      setProgress(currentVal)
    }, 150)

    return () => clearInterval(interval)
  }, [isOpen, isVi])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 transform transition-all text-left">
        
        {/* Top Header */}
        <div className="flex items-start justify-between mb-8 pr-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isVi ? 'Tải lên tài liệu học tập' : 'Upload Study Material'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isVi 
                ? 'Cung cấp tài liệu học tập và AI của chúng tôi sẽ tự động phân tích, kiểm duyệt và tổng hợp kiến thức ngay lập tức.' 
                : 'Provide study documents and our AI will build outlines, mindmaps, summaries, and flashcards instantly.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Circular Loader & Progress */}
        <div className="py-6 text-center space-y-6">
          {/* Circular Spinner */}
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <div className="absolute h-full w-full rounded-full border-4 border-slate-100 dark:border-slate-800" />
            <div
              className="absolute h-full w-full rounded-full border-4 border-[#2563eb] border-t-transparent animate-spin"
              style={{ animationDuration: '1.2s' }}
            />
            <span className="text-2xl font-black text-[#2563eb]">{progress}%</span>
          </div>

          {/* Status Message & Progress Bar */}
          <div className="space-y-3 max-w-md mx-auto">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 animate-pulse">
              {stepMsg}
            </h4>

            {/* Horizontal Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#2563eb] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              {isVi 
                ? 'Vui lòng giữ mở cửa sổ này trong khi AI đang xử lý tài liệu của bạn' 
                : 'Please keep this window open while AI processes your document'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AIScanningModal
