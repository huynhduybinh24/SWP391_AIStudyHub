import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PricingCard, type PricingPlan } from '../components/PricingCard'
import { ContactSalesModal } from '../components/ContactSalesModal'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { useAuthStore } from '@/stores/authStore'
import { AppFooter } from '@/components/shared/AppFooter'
import { POST_LOGIN_REDIRECT_KEY } from '@/features/auth/hooks/useLogin'
import { DEV_SKIP_AUTH } from '@/config/dev'

export function PricingPage({ isPublic = false }: { isPublic?: boolean }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { language } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false)

  // Dynamically load pricing configurations from localStorage
  const packagesList = useMemo(() => {
    let list = [
      {
        id: 'pkg-free',
        name: language === 'vi' ? 'Gói Miễn phí' : 'Free Plan',
        storageLimit: 10,
        priceMonthly: 0,
        perks: [
          language === 'vi' ? 'Dung lượng lưu trữ 10 GB' : '10 GB storage limit',
          language === 'vi' ? 'AI Chatbot trợ giúp cơ bản' : 'Basic AI Chatbot assistance',
          language === 'vi' ? 'Chia sẻ tài liệu tối đa 3 người' : 'Share files with up to 3 members',
          language === 'vi' ? 'Tốc độ tải xuống tiêu chuẩn' : 'Standard download speed'
        ]
      },
      {
        id: 'pkg-pro',
        name: language === 'vi' ? 'Gói Pro' : 'Pro Plan',
        storageLimit: 50,
        priceMonthly: 12,
        perks: [
          language === 'vi' ? 'Dung lượng lưu trữ 50 GB' : '50 GB storage limit',
          language === 'vi' ? 'AI Chatbot nâng cao & phân tích sâu' : 'Advanced AI chatbot & deep analysis',
          language === 'vi' ? 'Chia sẻ tệp tin không giới hạn' : 'Unlimited file sharing',
          language === 'vi' ? 'Tốc độ tải xuống băng thông cao' : 'High speed download bandwidth',
          language === 'vi' ? 'Bảo mật dữ liệu nâng cao bằng AI Guard' : 'Advanced security via AI Guard'
        ]
      }
    ]

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aiStudyHubPackages')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed.map((pkg: any) => {
              let name = pkg.name
              if (pkg.id === 'pkg-free') {
                name = language === 'vi' ? 'Gói Miễn phí' : 'Free Plan'
              } else if (pkg.id === 'pkg-pro') {
                name = language === 'vi' ? 'Gói Pro' : 'Pro Plan'
              }
              return {
                id: pkg.id,
                name: name,
                storageLimit: pkg.storageLimit,
                priceMonthly: pkg.priceMonthly,
                perks: pkg.perks || []
              }
            })
          }
        } catch (e) {
          console.error('Error loading packages in PricingPage:', e)
        }
      }
    }
    return list
  }, [language])

  // Localized pricing plans recalculated on language change and user package
  const localizedPricingPlans = useMemo<PricingPlan[]>(() => {
    const currentPlanCode = user?.plan || 'free'
    
    // Find current plan price to compare upgrade vs downgrade
    const currentPlanItem = packagesList.find(p => {
      const planCode = p.id === 'pkg-free' ? 'free' : p.id === 'pkg-pro' ? 'pro' : p.id
      return planCode === currentPlanCode
    })
    const currentPlanPrice = currentPlanItem ? currentPlanItem.priceMonthly : 0

    const plans: PricingPlan[] = packagesList.map((pkg) => {
      const planCode = pkg.id === 'pkg-free' ? 'free' : pkg.id === 'pkg-pro' ? 'pro' : pkg.id
      const isCurrent = currentPlanCode === planCode

      // Determine localized button text
      let buttonText = ''
      let buttonVariant: 'outline' | 'primary' | 'secondary' = 'primary'
      
      if (isCurrent) {
        buttonText = language === 'vi' ? 'Gói Hiện tại' : 'Current Plan'
        buttonVariant = 'outline'
      } else {
        const isUpgrade = pkg.priceMonthly > currentPlanPrice
        if (isUpgrade) {
          buttonText = language === 'vi' ? 'Nâng cấp' : 'Upgrade'
        } else {
          buttonText = language === 'vi' ? 'Hạ gói' : 'Downgrade'
        }
      }

      // Localize description
      let description = ''
      if (pkg.id === 'pkg-free') {
        description = language === 'vi' ? 'Dành cho người học thông thường cần hỗ trợ cơ bản.' : 'For casual learners needing basic assistance.'
      } else if (pkg.id === 'pkg-pro') {
        description = language === 'vi' ? 'Dành cho sinh viên tận tâm cần các công cụ chuyên sâu.' : 'For dedicated students requiring intensive tools.'
      } else {
        description = language === 'vi' ? 'Gói cước đặc biệt được thiết kế cho nhu cầu của bạn.' : 'Special plan tailored to your needs.'
      }

      // Pro savings text
      let yearlySavingText = undefined
      if (pkg.id === 'pkg-pro') {
        yearlySavingText = language === 'vi'
          ? `Hoặc $${(pkg.priceMonthly * 10).toFixed(0)}/năm (Tiết kiệm 16%)`
          : `Or $${(pkg.priceMonthly * 10).toFixed(0)}/year (Save 16%)`
      }

      return {
        name: pkg.name,
        price: `$${pkg.priceMonthly}`,
        billing: language === 'vi' ? '/tháng' : '/month',
        yearlySavingText,
        description,
        features: pkg.perks,
        buttonText,
        buttonVariant,
        popular: pkg.id === 'pkg-pro',
        isCurrent
      }
    })

    // Append Institutional Plan card
    plans.push({
      name: language === 'vi' ? 'Gói Tổ chức' : 'Institutional',
      price: language === 'vi' ? 'Liên hệ' : 'Custom',
      description: language === 'vi' ? 'Dành cho nhóm học tập, khoa hoặc trường đại học.' : 'For study groups, departments, or universities.',
      features: [
        language === 'vi' ? 'Bao gồm tất cả tính năng gói Pro' : 'Everything in Pro',
        language === 'vi' ? 'Thanh toán tập trung' : 'Centralized billing',
        language === 'vi' ? 'Bảng điều khiển quản trị' : 'Admin dashboard',
        language === 'vi' ? 'Trợ lý hỗ trợ riêng' : 'Dedicated success manager',
      ],
      buttonText: language === 'vi' ? 'Liên hệ kinh doanh' : 'Contact Sales',
      buttonVariant: 'secondary',
      isCurrent: false
    })

    return plans
  }, [packagesList, language, user])

  const handleCurrentPlanClick = () => {
    const currentPkg = packagesList.find(p => {
      const planCode = p.id === 'pkg-free' ? 'free' : p.id === 'pkg-pro' ? 'pro' : p.id
      return planCode === (user?.plan || 'free')
    })
    const name = currentPkg?.name || 'Free Plan'
    toast.info(language === 'vi' ? `Bạn đang sử dụng ${name}` : `You are currently on the ${name}`)
  }

  const handleUpgradeClick = () => {
    const isReallyAuthenticated = DEV_SKIP_AUTH ? false : isAuthenticated
    const isGuest = isPublic ? !isReallyAuthenticated : !user

    if (isGuest) {
      sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, '/dashboard/checkout')
      navigate('/login')
    } else {
      navigate('/dashboard/checkout')
    }
  }

  const handleContactSalesClick = () => {
    setIsContactSalesOpen(true)
  }

  const pricingContent = (
    <div className={`space-y-10 py-6 flex flex-col items-center select-none w-full ${isPublic ? 'max-w-7xl mx-auto px-4 md:px-8 min-h-[60vh]' : ''}`}>
      {/* Title & Subtitle */}
      <div className="text-center space-y-4 max-w-2xl px-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          {language === 'vi' ? 'Chọn gói dịch vụ của bạn' : language === 'ja' ? 'プランの選択' : language === 'ko' ? '요금제 선택' : 'Choose Your Plan'}
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          {language === 'vi' ? 'Mở khóa toàn bộ tiềm năng học tập với sự trợ giúp của AI. Chọn gói dịch vụ phù hợp nhất với nhu cầu của bạn.' : language === 'ja' ? 'AIを活用して学業 của 可能性を最大限に引き出しましょう。学習の強度に合ったプランを選択してください。' : language === 'ko' ? 'AI 기반 학업 성취의 잠재력을 최대한 발휘해 보세요. 학습 강도에 맞는 요금제를 선택하세요.' : 'Unlock the full potential of AI-powered academic success. Choose the tier that matches your study intensity.'}
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch w-full max-w-5xl mt-6 px-4">
        {localizedPricingPlans.map((plan, index) => (
          <PricingCard
            key={plan.name}
            plan={plan}
            index={index}
            onCurrentPlanClick={handleCurrentPlanClick}
            onUpgradeClick={handleUpgradeClick}
            onContactSalesClick={handleContactSalesClick}
          />
        ))}
      </div>

      {/* Contact Sales Form Modal */}
      <ContactSalesModal
        isOpen={isContactSalesOpen}
        onClose={() => setIsContactSalesOpen(false)}
      />
    </div>
  )

  if (isPublic) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        {/* Header bar */}
        <header className="h-20 bg-white dark:bg-slate-950 border-b border-border/40 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="font-extrabold text-2xl tracking-wider text-primary">LUMIEDU</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'vi' ? 'Quay lại Trang chủ' : 'Back to Home'}</span>
            </Link>
            {!user && (
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-[#0842A0] transition-colors">
                {language === 'vi' ? 'Đăng nhập' : 'Login'}
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 py-8 bg-slate-50 dark:bg-slate-900">
          {pricingContent}
        </main>

        <AppFooter />
      </div>
    )
  }

  return pricingContent
}

export default PricingPage
