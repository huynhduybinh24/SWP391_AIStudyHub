import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/loginSchema'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { OTPInput } from '@/features/settings/components/OTPInput'
import { authService } from '@/features/auth/services/authService'
import { useAuthStore } from '@/stores/authStore'
import { useTranslation } from '@/context/LanguageContext'
import { apiClient } from '@/lib/axios'

// Social Login Icon Components
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238598)">
        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
      </g>
    </svg>
  )
}

interface LoginFormProps {
  onMaintenanceMode?: (message: string) => void
}

export function LoginForm({ onMaintenanceMode }: LoginFormProps) {
  const login = useLogin()
  const navigate = useNavigate()
  const { language } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [requires2fa, setRequires2fa] = useState(false)
  const [twoFactorEmail, setTwoFactorEmail] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorError, setTwoFactorError] = useState('')
  const [isVerifying2fa, setIsVerifying2fa] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isServerLocked, setIsServerLocked] = useState(false)

  useEffect(() => {
    if (login.isError && login.error instanceof Error) {
      const errMsg = login.error.message
      if (errMsg.includes('bảo trì') || errMsg.toLowerCase().includes('maintenance')) {
        onMaintenanceMode?.(errMsg)
      }
    }
  }, [login.isError, login.error, onMaintenanceMode])

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const emailValue = watch('email')

  const getFailedAttempts = (email: string): number => {
    if (!email) return 0
    try {
      const cleanEmail = email.trim().toLowerCase()
      const stored = localStorage.getItem('loginFailedAttemptsPerEmail')
      const map = stored ? JSON.parse(stored) : {}
      return map[cleanEmail] || 0
    } catch {
      return 0
    }
  }

  const emailAttempts = getFailedAttempts(emailValue)
  const isPasswordLocked = emailAttempts >= 5 || isServerLocked

  useEffect(() => {
    const checkEmailLock = async () => {
      if (!emailValue || !emailValue.includes('@')) {
        setIsServerLocked(false)
        return
      }
      try {
        const { data } = await apiClient.get<{ locked: boolean }>(`/auth/check-lock?email=${encodeURIComponent(emailValue)}`)
        setIsServerLocked(data.locked)
      } catch (e) {
        setIsServerLocked(false)
      }
    }
    
    const timer = setTimeout(checkEmailLock, 300)
    return () => clearTimeout(timer)
  }, [emailValue])

  useEffect(() => {
    if (isPasswordLocked) {
      setError('password', {
        type: 'manual',
        message: language === 'vi'
          ? 'Tài khoản này đã nhập sai mật khẩu quá 5 lần. Vui lòng khôi phục mật khẩu.'
          : 'This account has exceeded the limit of 5 failed password attempts. Please reset your password.'
      })
    } else {
      if (errors.password?.message?.includes('5 lần') || errors.password?.message?.includes('5 failed')) {
        clearErrors('password')
      }
    }
  }, [emailValue, isPasswordLocked, setError, clearErrors, language, errors.password?.message])

  // Thực tế: Redirect thẳng tới các trang đăng nhập của Google/Facebook/Github
  const handleRealSocialLogin = (provider: 'google' | 'facebook' | 'github') => {
    // Chỉnh sửa callback URI tùy thuộc vào thiết lập backend của bạn
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback')

    if (provider === 'google') {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-dummy.apps.googleusercontent.com'
      if (clientId.includes('dummy')) {
        window.location.href = `${window.location.origin}/auth/callback?code=mock-google-code-123456`
        return
      }
      // Thêm prompt=select_account để ép Google luôn hiện bảng chọn tài khoản
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&prompt=select_account`
    } else if (provider === 'facebook') {
      const clientId = import.meta.env.VITE_FACEBOOK_CLIENT_ID || '123456789012345'
      window.location.href = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=email,public_profile`
    } else if (provider === 'github') {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Iv1.dummy1234567890'
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`
    }
  }

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (twoFactorCode.length !== 6) {
      setTwoFactorError('Vui lòng nhập đủ 6 chữ số / Code must be 6 digits')
      return
    }
    setTwoFactorError('')
    setIsVerifying2fa(true)
    try {
      const response = await authService.verify2fa(twoFactorEmail, twoFactorCode)
      useAuthStore.getState().setSession(response.user, response.tokens)

      const stored = sessionStorage.getItem('postLoginRedirect')
      if (stored) sessionStorage.removeItem('postLoginRedirect')
      
      const from = response.user.role.toLowerCase() === 'admin'
        ? '/dashboard/admin'
        : (stored || '/dashboard')
        
      navigate(from, { replace: true })
    } catch (err: any) {
      setTwoFactorError(err?.response?.data?.message || err?.message || 'Mã xác thực không đúng / Invalid code.')
    } finally {
      setIsVerifying2fa(false)
    }
  }

  if (requires2fa) {
    return (
      <div className="w-full max-w-[400px] mx-auto relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 rounded-t-2xl z-10"></div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 pt-8 shadow-xl text-slate-900 dark:text-slate-100">
          <div className="flex flex-col items-center gap-1.5 text-center mb-6">
            <div className="flex items-center justify-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-[52px] h-[52px] object-contain" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Xác thực 2FA</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nhập mã 6 chữ số từ ứng dụng xác thực của bạn.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handle2faSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300 text-center" htmlFor="2fa-code">
                Mã bảo mật (Security Code)
              </label>
              <OTPInput
                value={twoFactorCode}
                onChange={(val) => {
                  setTwoFactorCode(val)
                  if (twoFactorError) setTwoFactorError('')
                }}
              />
              {twoFactorError && (
                <p className="text-sm text-danger text-center mt-2 font-medium">
                  {twoFactorError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                className="w-full h-10 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm rounded-xl active:scale-[0.98] transition-all"
                disabled={isVerifying2fa}
              >
                {isVerifying2fa ? 'Đang xác thực...' : 'Xác nhận'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                onClick={() => {
                  setRequires2fa(false)
                  setTwoFactorCode('')
                  setTwoFactorError('')
                }}
              >
                Quay lại đăng nhập / Back to login
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[400px] mx-auto relative">
      {/* Top subtle gradient border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 rounded-t-2xl z-10"></div>
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 pt-8 shadow-xl text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-1.5 text-center mb-6">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-[52px] h-[52px] object-contain" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">LumiEdu</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back. Please enter your details.</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => {
            login.mutate({ ...values, remember: rememberMe }, {
              onSuccess: (data) => {
                if (data.requires2fa) {
                  setRequires2fa(true)
                  setTwoFactorEmail(data.email || values.email)
                }
                
                // Clear attempts for this specific email
                const cleanEmail = values.email.trim().toLowerCase()
                try {
                  const stored = localStorage.getItem('loginFailedAttemptsPerEmail')
                  if (stored) {
                    const map = JSON.parse(stored)
                    delete map[cleanEmail]
                    localStorage.setItem('loginFailedAttemptsPerEmail', JSON.stringify(map))
                  }
                } catch (e) {}
              },
              onError: (err: any) => {
                const backendMessage = err?.response?.data?.message || err?.message || ''
                if (backendMessage.includes('User not found')) {
                  setError('email', {
                    type: 'manual',
                    message: 'This email is not registered.'
                  })
                } else if (backendMessage.includes('Invalid credentials')) {
                  const cleanEmail = values.email.trim().toLowerCase()
                  let map: Record<string, number> = {}
                  try {
                    const stored = localStorage.getItem('loginFailedAttemptsPerEmail')
                    map = stored ? JSON.parse(stored) : {}
                  } catch (e) {}

                  const currentAttempts = map[cleanEmail] || 0
                  const newAttempts = currentAttempts + 1
                  map[cleanEmail] = newAttempts
                  localStorage.setItem('loginFailedAttemptsPerEmail', JSON.stringify(map))
                  
                  const errorMsg = language === 'vi'
                    ? `Mật khẩu không chính xác. Lần thử ${newAttempts}/5.`
                    : `Incorrect password. Attempt ${newAttempts} of 5.`

                  setError('password', {
                    type: 'manual',
                    message: errorMsg
                  })
                }
              }
            })
          })}
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">
              Email address
            </label>
            <Input 
              id="email" 
              type="email" 
              placeholder="student@university.edu"
              startIcon={<Mail className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
              error={errors.email?.message} 
              {...register('email')} 
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isPasswordLocked}
              startIcon={<Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
              endIcon={
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  disabled={isPasswordLocked}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Checkbox
              id="remember"
              label={<span className="text-slate-650 dark:text-slate-400">Remember me</span>}
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <Link to="/reset-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
              Forgot password?
            </Link>
          </div>

          {login.isError && (() => {
            const msg = login.error instanceof Error ? login.error.message : ''
            if (msg.includes('User not found') || msg.includes('Invalid credentials')) {
              return null
            }
            return (
              <p className="text-sm text-danger text-center">
                {msg || 'Login failed'}
              </p>
            )
          })()}

          <Button type="submit" className="w-full h-10 text-base font-semibold mt-2 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm rounded-xl active:scale-[0.98] transition-all" disabled={login.isPending || isPasswordLocked}>
            {login.isPending ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative flex items-center mb-5">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Or continue with
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <Button 
            type="button" 
            variant="secondary" 
            className="w-full h-11 bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-3 cursor-pointer"
            onClick={() => handleRealSocialLogin('google')}
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
