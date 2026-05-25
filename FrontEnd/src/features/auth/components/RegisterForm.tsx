import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Eye, EyeOff, User, LockKeyhole, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas/registerSchema'
import { useRegister } from '@/features/auth/hooks/useRegister'

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

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M16.2 5.7c.8-1 1.3-2.3 1.2-3.7-1.2.1-2.7.8-3.5 1.8-.7.8-1.3 2.1-1.1 3.5 1.4.1 2.7-.6 3.4-1.6zm-4.3 1.3c-2-.1-3.6 1.2-4.6 1.2-1 0-2.3-1-3.5-1-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 6.9 1.2 9.2.8 1.1 1.7 2.4 2.9 2.3 1.1-.1 1.6-.8 2.9-.8s1.7.8 2.9.8c1.2 0 2-1.2 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.6-1-2.6-4 0-2.5 2-3.7 2.1-3.7-1.2-1.7-3-1.9-3.6-2z"/>
    </svg>
  )
}

export function RegisterForm() {
  const registerMutation = useRegister()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', terms: false },
  })

  const passwordValue = watch('password')

  const handleRealSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback')

    if (provider === 'google') {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-dummy.apps.googleusercontent.com'
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&prompt=select_account`
    } else if (provider === 'facebook') {
      const clientId = import.meta.env.VITE_FACEBOOK_CLIENT_ID || '123456789012345'
      window.location.href = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=email,public_profile`
    } else if (provider === 'apple') {
      const clientId = import.meta.env.VITE_APPLE_CLIENT_ID || 'com.dummy.apple.client'
      window.location.href = `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=name%20email&response_mode=form_post`
    }
  }

  // Simple password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0
    let score = 0
    if (pwd.length > 5) score += 1
    if (pwd.length > 8) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[0-9!@#$%^&*]/.test(pwd)) score += 1
    return score // 0 to 4
  }

  const strength = getPasswordStrength(passwordValue)
  const strengthLabels = ['Poor', 'Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className="w-full max-w-[440px] mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-slate-900 dark:text-slate-100">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create an Account</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Start your journey to better grades today.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(({ fullName, email, password }) => registerMutation.mutate({ fullName, email, password }))}>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="fullName">
            Full Name
          </label>
          <Input 
            id="fullName" 
            type="text" 
            placeholder="e.g. Jane Doe"
            startIcon={<User className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            error={errors.fullName?.message} 
            {...register('fullName')} 
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">
            Student Email
          </label>
          <Input 
            id="email" 
            type="email" 
            placeholder="jane@university.edu"
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
            startIcon={<Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            endIcon={
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />
          {/* Password Strength */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-1 flex-1 mr-4">
              {[1, 2, 3, 4].map((level) => (
                <div 
                  key={level} 
                  className={`h-1.5 flex-1 rounded-full ${
                    strength >= level 
                      ? level <= 2 ? 'bg-blue-500' : 'bg-green-500' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`} 
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-450 w-10 text-right">
              {passwordValue ? strengthLabels[strength] : ''}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            startIcon={<LockKeyhole className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            endIcon={
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="focus:outline-none text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <div className="pt-2">
          <Checkbox 
            id="terms" 
            label={
              <span className="text-sm text-slate-600 dark:text-slate-400">
                I agree to the <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-semibold">Terms & Conditions</a>
              </span>
            }
            {...register('terms')}
            error={errors.terms?.message}
          />
        </div>

        {registerMutation.isError ? (
          <p className="text-sm text-danger mt-2">
            {registerMutation.error instanceof Error ? registerMutation.error.message : 'Registration failed'}
          </p>
        ) : null}

        <Button 
          type="submit" 
          className="w-full h-11 text-base font-semibold mt-4 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm flex items-center justify-center gap-2 rounded-xl active:scale-[0.98] transition-all" 
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
          {!registerMutation.isPending && <ArrowRight className="w-5 h-5" />}
        </Button>
      </form>

      <div className="mt-8 mb-6 relative flex items-center">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider">
          Or sign up with
        </span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
      </div>

      <div className="space-y-3">
        <Button 
          type="button" 
          variant="secondary" 
          className="w-full h-11 bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-3 cursor-pointer"
          onClick={() => handleRealSocialLogin('google')}
        >
          <GoogleIcon />
          Sign up with Google
        </Button>
      </div>

      <p className="mt-8 text-center text-[15px] text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
          Login
        </Link>
      </p>
    </div>
  )
}
