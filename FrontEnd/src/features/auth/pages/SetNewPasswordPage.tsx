import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Lock, Eye, EyeOff, RotateCcw, CheckCircle2, Circle, Mail, KeyRound } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { setNewPasswordSchema, type SetNewPasswordValues } from '@/features/auth/schemas/setNewPasswordSchema'
import { AppFooter } from '@/components/shared/AppFooter'
import { authService } from '@/features/auth/services/authService'

export function SetNewPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const emailParam = searchParams.get('email') || ''
  
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setError,
    formState: { errors },
  } = useForm<SetNewPasswordValues>({
    resolver: zodResolver(setNewPasswordSchema),
    defaultValues: { email: emailParam, otp: '', password: '', confirmPassword: '' },
    mode: 'onChange',
  })

  const emailValue = watch('email') || ''
  const passwordValue = watch('password') || ''
  const confirmPasswordValue = watch('confirmPassword') || ''

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  useEffect(() => {
    if (confirmPasswordValue) {
      trigger('confirmPassword')
    }
  }, [passwordValue, confirmPasswordValue, trigger])

  const handleResendOtp = async () => {
    if (!emailValue) {
      setError('email', { type: 'manual', message: 'Please enter your email to resend OTP.' })
      return
    }
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await authService.forgotPassword(emailValue)
      setSuccessMsg('A new OTP code has been sent successfully to your email!')
      setResendCooldown(60)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to resend OTP. Please try again later.')
    }
  }

  const onSubmit = async (data: SetNewPasswordValues) => {
    setIsSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await authService.resetPassword(data.email, data.otp, data.password)
      setIsSubmitting(false)
      setSuccessMsg('Password reset successfully! Redirecting to login page...')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setIsSubmitting(false)
      const backendMessage = err?.response?.data?.message || err?.message || ''
      
      if (backendMessage.includes("Invalid token")) {
        setError('otp', { 
          type: 'manual', 
          message: 'Invalid OTP code. Please check again.' 
        })
      } else if (backendMessage.includes("Email does not match this token")) {
        setError('otp', { 
          type: 'manual', 
          message: 'OTP code does not match this email.' 
        })
        setError('email', {
          type: 'manual',
          message: 'Email does not match the OTP code recipient.'
        })
      } else if (backendMessage.includes("Token expired or already used")) {
        setError('otp', { 
          type: 'manual', 
          message: 'OTP code has expired or has already been used.' 
        })
      } else {
        setErrorMsg(backendMessage || 'Invalid or expired OTP code.')
      }
    }
  }

  // Password requirement checks
  const hasMinLength = passwordValue.length >= 8
  const hasUpperCase = /[A-Z]/.test(passwordValue)
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordValue)

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F9FC] font-sans relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex flex-1 items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-sm border border-border/50 p-8 flex flex-col items-center">
          
          {/* Icon */}
          <div className="w-12 h-12 bg-[#3B41E3] rounded-xl flex items-center justify-center mb-6 relative">
            <RotateCcw className="w-6 h-6 text-white" strokeWidth={2.5} />
            <Lock className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#3B41E3]" strokeWidth={3} />
          </div>

          <h2 className="text-[28px] font-bold text-foreground mb-3 text-center">
            Set New Password
          </h2>
          <p className="text-body text-center text-[15px] mb-8 leading-relaxed">
            Please enter your new password below.
          </p>

          <form className="w-full space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground" htmlFor="email">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  startIcon={<Mail className="w-5 h-5 text-muted" />}
                  className="bg-white border-border/60 focus:bg-white"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-foreground" htmlFor="otp">
                    OTP Code (6 Digits)
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || !emailValue}
                    className="text-xs font-semibold text-[#3B41E3] hover:text-[#2d31b3] disabled:text-[#94a3b8] disabled:cursor-not-allowed transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                  </button>
                </div>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  startIcon={<KeyRound className="w-5 h-5 text-muted" />}
                  className="bg-white border-border/60 focus:bg-white font-mono tracking-widest text-center text-lg font-bold"
                  error={errors.otp?.message}
                  {...register('otp')}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-foreground" htmlFor="password">
                  New Password
                </label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  startIcon={<Lock className="w-5 h-5 text-muted" />}
                  endIcon={
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted" /> : <Eye className="w-5 h-5 text-muted" />}
                    </button>
                  }
                  className="bg-white border-border/60 focus:bg-white"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-foreground" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  startIcon={<Lock className="w-5 h-5 text-muted" />}
                  endIcon={
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="focus:outline-none hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5 text-muted" /> : <Eye className="w-5 h-5 text-muted" />}
                    </button>
                  }
                  className="bg-white border-border/60 focus:bg-white"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-[#F3F5F8] p-4 rounded-xl border border-border/40">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                PASSWORD REQUIREMENTS:
              </p>
              <ul className="space-y-2">
                <li className={`flex items-center gap-2 text-sm ${hasMinLength ? 'text-[#3B41E3] font-semibold' : 'text-body'}`}>
                  {hasMinLength ? <CheckCircle2 className="w-4 h-4 text-[#3B41E3]" /> : <Circle className="w-4 h-4 text-muted" />}
                  At least 8 characters long
                </li>
                <li className={`flex items-center gap-2 text-sm ${hasUpperCase ? 'text-[#3B41E3] font-semibold' : 'text-body'}`}>
                  {hasUpperCase ? <CheckCircle2 className="w-4 h-4 text-[#3B41E3]" /> : <Circle className="w-4 h-4 text-muted" />}
                  Contains at least one uppercase letter
                </li>
                <li className={`flex items-center gap-2 text-sm ${hasNumberOrSpecial ? 'text-[#3B41E3] font-semibold' : 'text-body'}`}>
                  {hasNumberOrSpecial ? <CheckCircle2 className="w-4 h-4 text-[#3B41E3]" /> : <Circle className="w-4 h-4 text-muted" />}
                  Contains at least one number or special character
                </li>
              </ul>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-500 text-center font-medium">
                {errorMsg}
              </p>
            )}

            {successMsg && (
              <p className="text-sm text-green-600 text-center font-semibold animate-pulse">
                {successMsg}
              </p>
            )}

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-12 text-[15px] font-semibold gap-2 flex items-center justify-center bg-[#1D4ED8] hover:bg-blue-700 transition-colors rounded-xl text-white"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </form>

          <div className="mt-6">
            <Link 
              to="/login" 
              className="flex items-center gap-2 text-sm font-semibold text-[#1D4ED8] hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </div>

      <AppFooter variant="simple" />
    </div>
  )
}
