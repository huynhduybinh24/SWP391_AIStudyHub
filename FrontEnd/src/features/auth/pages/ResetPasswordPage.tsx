import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Mail, RotateCcw, Lock, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { resetPasswordSchema, type ResetPasswordValues } from '@/features/auth/schemas/resetPasswordSchema'

export function ResetPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = (data: ResetPasswordValues) => {
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      console.log('Reset link sent to:', data.email)
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F9FC] font-sans relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex flex-1 items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-sm border border-border/50 p-8 flex flex-col items-center">
          
          {isSuccess ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-[28px] font-bold text-foreground mb-3 text-center">
                Check Your Email
              </h2>
              <p className="text-body text-center text-[15px] mb-8 leading-relaxed max-w-[320px]">
                We've sent a password recovery link to your email address. Please check your inbox.
              </p>
              <Button onClick={() => setIsSuccess(false)} variant="outline" className="w-full h-12 rounded-xl font-semibold">
                Send again
              </Button>
            </div>
          ) : (
            <>
              {/* Icon */}
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6 relative">
                <RotateCcw className="w-6 h-6 text-white" strokeWidth={2.5} />
                <Lock className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={3} />
              </div>

              <h2 className="text-[28px] font-bold text-foreground mb-3 text-center">
                Reset Password
              </h2>
              <p className="text-body text-center text-[15px] mb-8 leading-relaxed max-w-[320px]">
                Enter your student email to receive a password recovery link.
              </p>

              <form className="w-full space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label className="mb-2 block text-sm font-bold text-foreground" htmlFor="email">
                    Email Address
                  </label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="student@university.edu"
                    startIcon={<Mail className="w-5 h-5 text-muted" />}
                    className="bg-[#F8F9FB] border-border/60 focus:bg-white"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-12 text-[15px] font-semibold gap-2 flex items-center justify-center bg-primary hover:bg-primary-dark transition-colors rounded-xl"
                >
                  {isSubmitting ? 'Sending...' : (
                    <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </form>
            </>
          )}

          <div className="mt-8">
            <Link 
              to="/login" 
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#F3F5F8]/80 backdrop-blur-sm border-t border-border/50 py-6 px-8 flex flex-col md:flex-row items-center justify-between text-sm text-body relative z-10">
        <p>© 2024 AI Study Hub. All rights reserved.</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0 font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/" className="hover:text-primary transition-colors">Features</Link>
          <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
          <Link to="/login" className="hover:text-primary transition-colors">Register</Link>
          <Link to="/" className="hover:text-primary transition-colors">Help Center</Link>
        </div>
      </footer>
    </div>
  )
}
