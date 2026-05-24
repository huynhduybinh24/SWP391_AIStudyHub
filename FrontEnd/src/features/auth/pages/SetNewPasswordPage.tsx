import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Lock, Eye, EyeOff, RotateCcw, CheckCircle2, Circle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { setNewPasswordSchema, type SetNewPasswordValues } from '@/features/auth/schemas/setNewPasswordSchema'
import { AppFooter } from '@/components/shared/AppFooter'

export function SetNewPasswordPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetNewPasswordValues>({
    resolver: zodResolver(setNewPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const passwordValue = watch('password')

  const onSubmit = (data: SetNewPasswordValues) => {
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      console.log('Password updated successfully:', data)
      setIsSubmitting(false)
      navigate('/login')
    }, 1500)
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
