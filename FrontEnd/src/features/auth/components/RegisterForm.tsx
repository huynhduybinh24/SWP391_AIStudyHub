import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Eye, EyeOff, User, LockKeyhole, ArrowRight, GraduationCap, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas/registerSchema'
import { useRegister } from '@/features/auth/hooks/useRegister'
import { useTranslation } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

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


export function RegisterForm() {
  const registerMutation = useRegister()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { language } = useTranslation()

  const [isOtpStep, setIsOtpStep] = useState(false)
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [resendTimer, setResendTimer] = useState(59)
  const [tempFormData, setTempFormData] = useState<RegisterFormValues | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    let interval: any
    if (isOtpStep && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isOtpStep, resendTimer])

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return

    const newOtpValues = [...otpValues]
    newOtpValues[index] = value.slice(-1)
    setOtpValues(newOtpValues)
    setOtpError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const newOtpValues = [...otpValues]
      newOtpValues[index - 1] = ''
      setOtpValues(newOtpValues)
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (!/^\d{6}$/.test(pastedData)) return

    const digits = pastedData.split('')
    setOtpValues(digits)
    setOtpError('')
    inputRefs.current[5]?.focus()
  }

  const handleResendOtp = () => {
    setResendTimer(59)
    setOtpValues(['', '', '', '', '', ''])
    setOtpError('')
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otpValues.join('')
    if (otpCode.length < 6) {
      const err = language === 'vi' 
        ? 'Vui lòng nhập đầy đủ mã OTP 6 chữ số.' 
        : (language === 'ja' ? '6桁のOTPコードをすべて入力してください。' : (language === 'ko' ? '6자리 OTP 코드를 모두 입력해 주세요.' : 'Please enter the complete 6-digit OTP code.'))
      setOtpError(err)
      return
    }

    if (otpCode !== '123456') {
      const err = language === 'vi' 
        ? 'Mã OTP không chính xác. Thử lại với mã: 123456!' 
        : (language === 'ja' ? 'OTPコードが正しくありません。123456で試してください！' : (language === 'ko' ? 'OTP 코드가 올바르지 않습니다. 123456으로 시도하세요!' : 'Incorrect OTP code. Try 123456!'))
      setOtpError(err)
      return
    }

    if (tempFormData) {
      registerMutation.mutate(tempFormData)
    }
  }

  const handleRegisterSubmit = (values: RegisterFormValues) => {
    setTempFormData(values)
    setIsOtpStep(true)
    setResendTimer(59)
    setOtpValues(['', '', '', '', '', ''])
    setOtpError('')
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', role: 'user', terms: false },
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
  const strengthLabels = language === 'vi'
    ? ['Kém', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh']
    : (language === 'ja' ? ['弱い', 'やや弱い', '普通', '良い', '強い'] : (language === 'ko' ? ['취약', '약함', '보통', '좋음', '강함'] : ['Poor', 'Weak', 'Fair', 'Good', 'Strong']))

  const titleText = language === 'vi' 
    ? 'Tạo tài khoản' 
    : (language === 'ja' ? 'アカウント作成' : (language === 'ko' ? '계정 만들기' : 'Create an Account'))

  const subtitleText = language === 'vi'
    ? 'Bắt đầu hành trình nâng cao kết quả học tập của bạn ngay hôm nay.'
    : (language === 'ja' ? '学業向上への旅を今すぐ始めましょう。' : (language === 'ko' ? '오늘부터 학업 성적 향상을 위한 여정을 시작하세요.' : 'Start your journey to better grades today.'))

  const fullNameLabel = language === 'vi'
    ? 'Họ và tên'
    : (language === 'ja' ? 'フルネーム' : (language === 'ko' ? '성함' : 'Full Name'))

  const fullNamePlaceholder = language === 'vi'
    ? 'Ví dụ: Nguyễn Văn A'
    : (language === 'ja' ? '例：山田 太郎' : (language === 'ko' ? '예: 홍길동' : 'e.g. Jane Doe'))

  const emailLabel = language === 'vi'
    ? 'Địa chỉ Email'
    : (language === 'ja' ? 'メールアドレス' : (language === 'ko' ? '이메일 주소' : 'Email Address'))

  const emailPlaceholder = language === 'vi'
    ? 'example@example.com'
    : (language === 'ja' ? 'example@example.com' : (language === 'ko' ? 'example@example.com' : 'jane@example.com'))

  const passwordLabel = language === 'vi'
    ? 'Mật khẩu'
    : (language === 'ja' ? 'パスワード' : (language === 'ko' ? '비밀번호' : 'Password'))

  const confirmPasswordLabel = language === 'vi'
    ? 'Xác nhận mật khẩu'
    : (language === 'ja' ? 'パスワードの確認' : (language === 'ko' ? '비밀번호 확인' : 'Confirm Password'))

  const occupationLabel = language === 'vi' 
    ? 'Vai trò / Công việc' 
    : (language === 'ja' ? '役職 / 職業' : (language === 'ko' ? '역할 / 직업' : 'Role / Occupation'))

  const studentLabel = language === 'vi' 
    ? 'Học sinh' 
    : (language === 'ja' ? '学生' : (language === 'ko' ? '학생' : 'Student'))

  const teacherLabel = language === 'vi' 
    ? 'Giáo viên' 
    : (language === 'ja' ? '教師' : (language === 'ko' ? '교사' : 'Teacher'))

  const agreeText = language === 'vi'
    ? 'Tôi đồng ý với các'
    : (language === 'ja' ? '利用規約に同意する' : (language === 'ko' ? '이용약관에 동의합니다' : 'I agree to the'))

  const termsText = language === 'vi'
    ? 'Điều khoản & Điều kiện'
    : (language === 'ja' ? '利用規約' : (language === 'ko' ? '이용약관' : 'Terms & Conditions'))

  const createAccountButtonText = registerMutation.isPending
    ? (language === 'vi' ? 'Đang tạo tài khoản...' : (language === 'ja' ? 'アカウント作成中...' : (language === 'ko' ? '계정 생성 중...' : 'Creating Account...')))
    : (language === 'vi' ? 'Đăng ký tài khoản' : (language === 'ja' ? 'アカウントを作成' : (language === 'ko' ? '계정 만들기' : 'Create Account')))

  const orText = language === 'vi'
    ? 'Hoặc đăng ký bằng'
    : (language === 'ja' ? 'または以下で登録' : (language === 'ko' ? '또는 다음으로 가입' : 'Or sign up with'))

  const googleText = language === 'vi'
    ? 'Đăng ký bằng Google'
    : (language === 'ja' ? 'Googleで登録' : (language === 'ko' ? 'Google로 가입' : 'Sign up with Google'))

  const alreadyText = language === 'vi'
    ? 'Đã có tài khoản?'
    : (language === 'ja' ? 'すでにアカウントをお持ちですか？' : (language === 'ko' ? '이미 계정이 있으신가요?' : 'Already have an account?'))

  const loginText = language === 'vi'
    ? 'Đăng nhập'
    : (language === 'ja' ? 'ログイン' : (language === 'ko' ? '로그인' : 'Login'))

  if (isOtpStep) {
    const otpTitle = language === 'vi' ? 'Xác minh tài khoản' : (language === 'ja' ? 'アカウント認証' : (language === 'ko' ? '계정 인증' : 'Account Verification'))
    const otpSubtitle = language === 'vi' 
      ? `Chúng tôi đã gửi mã xác thực OTP 6 số tới email:` 
      : (language === 'ja' ? `ご登録のメールアドレスに6桁のOTPを送信しました：` : (language === 'ko' ? `등록하신 이메일로 6자리 OTP 코드를 발송했습니다:` : `We have sent a 6-digit verification code to:`))
    const otpLabel = language === 'vi' ? 'Mã xác thực OTP' : (language === 'ja' ? '認証コード' : (language === 'ko' ? '인증 코드' : 'Verification Code'))
    const otpVerifyBtn = registerMutation.isPending 
      ? (language === 'vi' ? 'Đang kích hoạt...' : (language === 'ja' ? '有効化中...' : (language === 'ko' ? '활성화 중...' : 'Activating...')))
      : (language === 'vi' ? 'Xác nhận & Hoàn tất' : (language === 'ja' ? '確認して完了' : (language === 'ko' ? '확인 및 완료' : 'Confirm & Complete')))
    const otpResendText = language === 'vi' ? 'Không nhận được mã?' : (language === 'ja' ? 'コードが届きませんか？' : (language === 'ko' ? '코드를 받지 못하셨나요?' : "Didn't receive the code?"))
    const otpResendBtn = language === 'vi' ? 'Gửi lại mã' : (language === 'ja' ? '再送信' : (language === 'ko' ? '재전송' : 'Resend Code'))
    const otpBackBtn = language === 'vi' ? 'Quay lại chỉnh sửa' : (language === 'ja' ? '入力内容の変更' : (language === 'ko' ? '정보 수정하기' : 'Back to edit details'))
    const otpDemoHintText = language === 'vi' 
      ? '💡 Demo: Sử dụng mã OTP mặc định là 123456 để kích hoạt nhanh.' 
      : (language === 'ja' ? '💡 デモ: 有効化するには 123456 を入力してください。' : (language === 'ko' ? '💡 데모: 빠른 활성화를 위해 기본 OTP 123456을 입력하세요.' : '💡 Demo: Use the default OTP code 123456 for instant activation.'))

    return (
      <div className="w-full max-w-[440px] mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-slate-900 dark:text-slate-100 animate-in fade-in duration-300">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/50">
            <LockKeyhole className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{otpTitle}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
            {otpSubtitle} <br />
            <strong className="text-slate-700 dark:text-slate-250 font-bold block mt-1">{tempFormData?.email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-450 dark:text-slate-500 text-center">
              {otpLabel}
            </label>
            <div className="flex justify-between gap-2 max-w-[320px] mx-auto">
              {otpValues.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  className={cn(
                    "w-11 h-11 md:w-12 md:h-12 text-center text-xl font-bold rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                    digit 
                      ? "border-blue-600 bg-blue-50/10 dark:border-blue-500 dark:bg-blue-950/10 text-slate-900 dark:text-white"
                      : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/30 text-slate-900 dark:text-slate-100",
                    otpError && "border-danger focus-visible:ring-danger/30"
                  )}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            {otpError && (
              <p className="text-center text-sm font-semibold text-danger animate-in fade-in duration-200 mt-2">
                {otpError}
              </p>
            )}
          </div>

          {/* Demo OTP Banner */}
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl text-xs font-semibold text-[#3155F6] dark:text-blue-400 leading-relaxed flex items-start gap-2.5">
            <span>{otpDemoHintText}</span>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm flex items-center justify-center gap-2 rounded-xl active:scale-[0.98] transition-all"
            disabled={registerMutation.isPending}
          >
            {otpVerifyBtn}
            {!registerMutation.isPending && <ArrowRight className="w-5 h-5" />}
          </Button>

          <div className="flex flex-col items-center gap-4 pt-2">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {otpResendText}{' '}
              {resendTimer > 0 ? (
                <span className="text-slate-400 dark:text-slate-500 font-semibold">
                  {language === 'vi' 
                    ? `Gửi lại sau ${resendTimer}s` 
                    : (language === 'ja' ? `${resendTimer}秒後に再送信可能` : (language === 'ko' ? `${resendTimer}초 후 재전송` : `Resend in ${resendTimer}s`))}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline focus:outline-none"
                >
                  {otpResendBtn}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOtpStep(false);
                setOtpValues(['', '', '', '', '', '']);
                setOtpError('');
              }}
              className="text-xs font-bold text-slate-450 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-350 hover:underline transition-colors focus:outline-none uppercase tracking-wide"
            >
              {otpBackBtn}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[440px] mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-slate-900 dark:text-slate-100">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{titleText}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base font-medium">{subtitleText}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(handleRegisterSubmit)}>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="fullName">
            {fullNameLabel}
          </label>
          <Input 
            id="fullName" 
            type="text" 
            placeholder={fullNamePlaceholder}
            startIcon={<User className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            error={errors.fullName?.message} 
            {...register('fullName')} 
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">
            {emailLabel}
          </label>
          <Input 
            id="email" 
            type="email" 
            placeholder={emailPlaceholder}
            startIcon={<Mail className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            error={errors.email?.message} 
            {...register('email')} 
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">
            {passwordLabel}
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
            {confirmPasswordLabel}
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
                {agreeText} <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-semibold">{termsText}</a>
              </span>
            }
            {...register('terms')}
            error={errors.terms?.message}
          />
        </div>

        {registerMutation.isError ? (
          registerMutation.error instanceof Error && registerMutation.error.message === 'email_already_exists' ? (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 p-4 rounded-xl flex flex-col gap-3 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-xs flex-shrink-0 mt-0.5">!</div>
                <div className="flex-1 text-sm text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                  {language === 'vi' 
                    ? 'Email này đã tồn tại trong hệ thống. Bạn có muốn đăng nhập bằng tài khoản này không?' 
                    : 'This email is already registered. Would you like to login instead?'}
                </div>
              </div>
              <div className="flex justify-end">
                <Link
                  to="/login"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.97]"
                >
                  {language === 'vi' ? 'Đăng nhập ngay' : 'Login Now'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-danger mt-2 font-medium">
              {registerMutation.error instanceof Error ? registerMutation.error.message : 'Registration failed'}
            </p>
          )
        ) : null}

        <Button 
          type="submit" 
          className="w-full h-11 text-base font-semibold mt-4 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm flex items-center justify-center gap-2 rounded-xl active:scale-[0.98] transition-all" 
          disabled={registerMutation.isPending}
        >
          {createAccountButtonText}
          {!registerMutation.isPending && <ArrowRight className="w-5 h-5" />}
        </Button>
      </form>

      <div className="mt-8 mb-6 relative flex items-center">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider">
          {orText}
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
          {googleText}
        </Button>
      </div>

      <p className="mt-8 text-center text-[15px] text-slate-500 dark:text-slate-400">
        {alreadyText}{' '}
        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
          {loginText}
        </Link>
      </p>
    </div>
  )
}
