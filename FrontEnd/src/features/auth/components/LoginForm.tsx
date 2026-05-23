import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/loginSchema'
import { useLogin } from '@/features/auth/hooks/useLogin'

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

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

export function LoginForm() {
  const login = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Thực tế: Redirect thẳng tới các trang đăng nhập của Google/Facebook/Github
  const handleRealSocialLogin = (provider: 'google' | 'facebook' | 'github') => {
    // Chỉnh sửa callback URI tùy thuộc vào thiết lập backend của bạn
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback')

    if (provider === 'google') {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-dummy.apps.googleusercontent.com'
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

  return (
    <div className="w-full max-w-[400px] mx-auto relative">
      {/* Top subtle gradient border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 rounded-t-2xl z-10"></div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-border p-6 pt-8">
        <div className="flex flex-col items-center gap-1.5 text-center mb-6">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-[52px] h-[52px] object-contain" />
            <h1 className="text-2xl font-bold text-primary">AI Study Hub</h1>
          </div>
          <p className="text-sm text-body">Welcome back. Please enter your details.</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => login.mutate(values))}
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground" htmlFor="email">
              Email address
            </label>
            <Input 
              id="email" 
              type="email" 
              placeholder="student@university.edu"
              startIcon={<Mail className="w-5 h-5 text-muted" />}
              error={errors.email?.message} 
              {...register('email')} 
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground" htmlFor="password">
              Password
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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Checkbox id="remember" label="Remember me" />
            <Link to="/reset-password" className="text-sm font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          {login.isError ? (
            <p className="text-sm text-danger text-center">
              {login.error instanceof Error ? login.error.message : 'Login failed'}
            </p>
          ) : null}

          <Button type="submit" className="w-full h-10 text-base font-semibold mt-2" disabled={login.isPending}>
            {login.isPending ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative flex items-center mb-5">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-semibold text-muted uppercase tracking-wider">
              Or continue with
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <Button 
            type="button" 
            variant="secondary" 
            className="w-full h-11 bg-white border border-[#E5E7EB] hover:bg-gray-50 flex items-center justify-center gap-3 text-[#0B1C30] font-semibold rounded-xl"
            onClick={() => handleRealSocialLogin('google')}
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-body">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
