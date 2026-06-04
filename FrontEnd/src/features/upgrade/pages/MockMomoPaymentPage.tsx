import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, ArrowLeft, Loader2, Info } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export function MockMomoPaymentPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  const orderId = searchParams.get('orderId') || 'INV-UNKNOWN'
  const amountStr = searchParams.get('amount') || '200000'
  const amount = parseInt(amountStr, 10)
  
  const [isProcessing, setIsProcessing] = useState(false)

  // Format currency: 200000 -> 200.000đ
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ'
  }

  const handleBypassPayment = async () => {
    setIsProcessing(true)
    toast.info('Đang giả lập xác nhận thanh toán với hệ thống...')
    
    try {
      // Direct call to the backend mock callback endpoint
      window.location.href = `http://localhost:8080/api/billing/momo-callback-mock?orderId=${orderId}`
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi khi giả lập thanh toán')
      setIsProcessing(false)
    }
  }

  // Dynamic QR Code link pointing to the mock callback URL
  const qrData = `http://localhost:8080/api/billing/momo-callback-mock?orderId=${orderId}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-slate-950 flex flex-col justify-between transition-colors duration-300 font-sans text-slate-800 dark:text-slate-100">
      
      {/* Header Bar */}
      <header className="bg-[#A50064] text-white py-4 px-6 md:px-12 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg flex items-center justify-center shadow-inner">
            <span className="text-[#A50064] font-black text-lg tracking-tighter">momo</span>
          </div>
          <span className="font-extrabold text-lg tracking-tight hidden sm:inline">Cổng Thanh Toán MoMo (Giả lập Sandbox)</span>
        </div>
        <button
          onClick={() => navigate('/dashboard/upgrade')}
          className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-lg transition-colors border border-white/20"
        >
          <ArrowLeft className="size-3.5" />
          Quay lại
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex justify-center items-center p-4 md:p-8">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Panel: Invoice Details (5 cols) */}
          <div className="md:col-span-5 bg-slate-50 dark:bg-slate-900/40 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Thông tin đơn hàng</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500">Nhà cung cấp</label>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">LumiEdu Store (AI Study Hub)</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500">Mã đơn hàng</label>
                  <p className="font-mono font-bold text-[#A50064] text-sm break-all">{orderId}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500">Mô tả dịch vụ</label>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Nâng cấp tài khoản gói Pro (1 tháng)</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500">Số tiền thanh toán</label>
              <div className="text-3xl font-black text-[#A50064] dark:text-[#c21880] tracking-tight mt-1">
                {formatCurrency(amount)}
              </div>
            </div>
          </div>

          {/* Right Panel: QR Code and Bypass Controls (7 cols) */}
          <div className="md:col-span-7 p-6 md:p-10 flex flex-col items-center justify-center text-center space-y-6">
            
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3 text-left max-w-md">
              <Info className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
                Đây là cổng thanh toán giả lập dành cho kiểm thử. Bạn có thể sử dụng điện thoại quét mã QR để thanh toán trực tiếp, hoặc nhấn nút bên dưới để thanh toán ngay mà không cần dùng App.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3">
              <img 
                src={qrImageUrl} 
                alt="MoMo Test QR Code"
                className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-lg"
              />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Quét mã QR để thanh toán</span>
            </div>

            {/* Actions */}
            <div className="w-full max-w-md space-y-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleBypassPayment}
                disabled={isProcessing}
                className="w-full bg-[#A50064] hover:bg-[#8a0053] text-white py-4 px-6 rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-[#A50064]/20 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-sm md:text-base focus:outline-none"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang hoàn tất giao dịch...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-5" />
                    Mô phỏng thanh toán thành công
                  </>
                )}
              </motion.button>
              
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                © Bản quyền thuộc về MoMo & LumiEdu Integration Portal
              </p>
            </div>

          </div>

        </div>
      </main>

      {/* Footer Footer */}
      <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 text-center text-xs text-slate-400 font-semibold transition-colors duration-300">
        Môi trường thanh toán thử nghiệm (MoMo Sandbox Bypass Tool)
      </footer>

    </div>
  )
}

export default MockMomoPaymentPage
