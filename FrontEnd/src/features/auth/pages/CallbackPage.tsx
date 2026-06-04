import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '@/features/auth/services/authService'
import { useAuthStore } from '@/stores/authStore'
import { POST_LOGIN_REDIRECT_KEY } from '@/features/auth/hooks/useLogin'
import { ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/context/LanguageContext'

export function CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const { language } = useTranslation()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setStatus('error')
      setErrorMsg(
        language === 'vi'
          ? 'Không tìm thấy mã xác thực Google (auth code).'
          : 'Google auth code not found in redirect URL.'
      )
      return
    }

    const handleGoogleCallback = async () => {
      try {
        const redirectUri = window.location.origin + '/auth/callback'
        const response = await authService.googleLogin(code, redirectUri)

        setStatus('success')
        setSession(response.user, response.tokens)

        // Wait a second for user to see the success state, then redirect
        setTimeout(() => {
          const stored = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
          if (stored) sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)

          const from = response.user.role.toLowerCase() === 'admin'
            ? '/dashboard/admin'
            : (stored || '/dashboard')

          navigate(from, { replace: true })
        }, 1200)
      } catch (err: any) {
        console.error('Google login failed:', err)
        setStatus('error')
        setErrorMsg(err.message || 'Đã xảy ra lỗi khi đăng nhập bằng Google.')
      }
    }

    handleGoogleCallback()
  }, [searchParams, navigate, setSession, language])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center relative overflow-hidden">
        {/* Top subtle gradient border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600"></div>

        {status === 'loading' && (
          <div className="py-6 flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              {language === 'vi' ? 'Đang xác thực tài khoản...' : 'Authenticating account...'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[280px]">
              {language === 'vi'
                ? 'Đang kết nối hệ thống và đăng nhập qua tài khoản Google của bạn.'
                : 'Connecting to our servers to securely log you in via Google.'}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-950/30 rounded-2xl flex items-center justify-center border border-green-100 dark:border-green-900/50">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              {language === 'vi' ? 'Đăng nhập thành công!' : 'Success!'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[280px]">
              {language === 'vi' ? 'Đang chuyển hướng bạn vào hệ thống...' : 'Redirecting you to dashboard...'}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-danger/10 rounded-2xl flex items-center justify-center border border-danger/20">
              <ShieldAlert className="w-8 h-8 text-danger" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              {language === 'vi' ? 'Đăng nhập thất bại' : 'Authentication Failed'}
            </h2>
            <p className="text-danger dark:text-red-400 text-sm font-medium bg-danger/5 dark:bg-danger/10 border border-danger/10 rounded-xl p-3 max-w-[320px] leading-relaxed">
              {errorMsg}
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm active:scale-[0.98] transition-all"
            >
              {language === 'vi' ? 'Quay lại trang đăng nhập' : 'Back to Login'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
