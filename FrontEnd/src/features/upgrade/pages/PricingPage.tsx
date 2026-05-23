import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PricingCard, type PricingPlan } from '../components/PricingCard'
import { ContactSalesModal } from '../components/ContactSalesModal'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { useAuthStore } from '@/stores/authStore'

export function PricingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { t, language } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false)

  // Localized pricing plans recalculated on language change
  const localizedPricingPlans = useMemo<PricingPlan[]>(() => [
    {
      name: language === 'vi' ? 'Gói Miễn phí' : language === 'ja' ? 'フリープラン' : language === 'ko' ? '무료 요금제' : 'Free Plan',
      price: '$0',
      billing: language === 'vi' ? '/tháng' : language === 'ja' ? '/月' : language === 'ko' ? '/월' : '/month',
      description: language === 'vi' ? 'Dành cho người học thông thường cần hỗ trợ cơ bản.' : language === 'ja' ? '基本的な支援が必要な一般の学習者向け。' : language === 'ko' ? '기본적인 지원이 필요한 일반 학습자용.' : 'For casual learners needing basic assistance.',
      features: [
        language === 'vi' ? 'Dung lượng cơ bản (5GB)' : language === 'ja' ? '基本ストレージ (5GB)' : language === 'ko' ? '기본 저장 공간 (5GB)' : 'Core storage (5GB)',
        language === 'vi' ? 'Tóm tắt AI cơ bản (10 bản/tháng)' : language === 'ja' ? '基本的なAI要約 (10回/月)' : language === 'ko' ? '기본 AI 요약 (월 10회)' : 'Basic AI summaries (10/mo)',
        language === 'vi' ? 'Kế hoạch học tập chuẩn' : language === 'ja' ? '標準的な学習計画' : language === 'ko' ? '표준 학습 계획' : 'Standard study plans',
      ],
      buttonText: language === 'vi' ? 'Gói Hiện tại' : language === 'ja' ? '現在のプラン' : language === 'ko' ? '현재 요금제' : 'Current Plan',
      buttonVariant: 'outline',
      isCurrent: true,
    },
    {
      name: language === 'vi' ? 'Gói Pro' : language === 'ja' ? 'プロプラン' : language === 'ko' ? '프로 요금제' : 'Pro Plan',
      price: '$120.00',
      billing: language === 'vi' ? '/tháng' : language === 'ja' ? '/月' : language === 'ko' ? '/월' : '/month',
      yearlySavingText: language === 'vi' ? 'Hoặc $120/năm (Tiết kiệm 16%)' : language === 'ja' ? 'または $120/年 (16%お得)' : language === 'ko' ? '또는 $120/연 (16% 절약)' : 'Or $120/year (Save 16%)',
      description: language === 'vi' ? 'Dành cho sinh viên tận tâm cần các công cụ chuyên sâu.' : language === 'ja' ? '高度なツールを必要とする熱心な学生向け。' : language === 'ko' ? '심층적인 도구가 필요한 열정적인 학생용.' : 'For dedicated students requiring intensive tools.',
      features: [
        language === 'vi' ? 'Không giới hạn tóm tắt AI' : language === 'ja' ? '無制限のAI要約' : language === 'ko' ? '무제한 AI 요약' : 'Unlimited AI summaries',
        language === 'vi' ? 'Truy cập chatbot chuyên sâu' : language === 'ja' ? '詳細なチャットボットへのアクセス' : language === 'ko' ? '심층 챗봇 액세스' : 'Deep-dive chatbot access',
        language === 'vi' ? '50GB Dung lượng đám mây' : language === 'ja' ? '50GBのクラウドストレージ' : language === 'ko' ? '50GB 클라우드 저장 공간' : '50GB Cloud storage',
        language === 'vi' ? 'Phân tích học tập nâng cao' : language === 'ja' ? '高度な学習分析' : language === 'ko' ? '고급 학습 분석' : 'Advanced study analytics',
        language === 'vi' ? 'Hỗ trợ ưu tiên' : language === 'ja' ? '優先サポート' : language === 'ko' ? '우선 지원' : 'Priority support',
      ],
      buttonText: t.sidebar.upgradePro,
      buttonVariant: 'primary',
      popular: true,
    },
    {
      name: language === 'vi' ? 'Gói Tổ chức' : language === 'ja' ? '機関プラン' : language === 'ko' ? '기관 요금제' : 'Institutional',
      price: language === 'vi' ? 'Liên hệ' : language === 'ja' ? 'カスタム' : language === 'ko' ? '맞춤형' : 'Custom',
      description: language === 'vi' ? 'Dành cho nhóm học tập, khoa hoặc trường đại học.' : language === 'ja' ? '学習グループ、学部、または大学向け。' : language === 'ko' ? '스터디 그룹, 학과 또는 대학교용.' : 'For study groups, departments, or universities.',
      features: [
        language === 'vi' ? 'Bao gồm tất cả tính năng gói Pro' : language === 'ja' ? 'Proプランの全機能' : language === 'ko' ? 'Pro 요금제의 모든 기능 포함' : 'Everything in Pro',
        language === 'vi' ? 'Thanh toán tập trung' : language === 'ja' ? '一括請求' : language === 'ko' ? '통합 청구' : 'Centralized billing',
        language === 'vi' ? 'Bảng điều khiển quản trị' : language === 'ja' ? '管理者ダッシュボード' : language === 'ko' ? '관리자 대시보드' : 'Admin dashboard',
        language === 'vi' ? 'Trợ lý hỗ trợ riêng' : language === 'ja' ? '専任のサクセスマネージャー' : language === 'ko' ? '전담 성공 매니저' : 'Dedicated success manager',
      ],
      buttonText: language === 'vi' ? 'Liên hệ kinh doanh' : language === 'ja' ? '営業へ問い合わせ' : language === 'ko' ? '영업 문의' : 'Contact Sales',
      buttonVariant: 'secondary',
    },
  ], [language, t])

  const handleCurrentPlanClick = () => {
    toast.info(`You are currently on the ${user?.plan === 'pro' ? 'Pro' : 'Free'} Plan`)
  }

  const handleUpgradeClick = () => {
    navigate('/dashboard/checkout')
  }

  const handleContactSalesClick = () => {
    setIsContactSalesOpen(true)
  }

  return (
    <div className="space-y-10 py-6 flex flex-col items-center select-none w-full">
      {/* Title & Subtitle */}
      <div className="text-center space-y-4 max-w-2xl px-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          {language === 'vi' ? 'Chọn gói dịch vụ của bạn' : language === 'ja' ? 'プランの選択' : language === 'ko' ? '요금제 선택' : 'Choose Your Plan'}
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          {language === 'vi' ? 'Mở khóa toàn bộ tiềm năng học tập với sự trợ giúp của AI. Chọn gói dịch vụ phù hợp nhất với nhu cầu của bạn.' : language === 'ja' ? 'AIを活用して学業の可能性を最大限に引き出しましょう。学習の強度に合ったプランを選択してください。' : language === 'ko' ? 'AI 기반 학업 성취의 잠재력을 최대한 발휘해 보세요. 학습 강도에 맞는 요금제를 선택하세요.' : 'Unlock the full potential of AI-powered academic success. Choose the tier that matches your study intensity.'}
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch w-full max-w-5xl mt-6 px-4">
        {localizedPricingPlans.map((plan, index) => {
          let dynamicPlan = { ...plan }
          if (plan.name === 'Free Plan') {
            const isFree = !user || user.plan === 'free'
            dynamicPlan.isCurrent = isFree
            dynamicPlan.buttonText = isFree ? 'Current Plan' : 'Downgrade'
          }
          if (plan.name === 'Pro Plan') {
            const isPro = user?.plan === 'pro'
            dynamicPlan.isCurrent = isPro
            dynamicPlan.buttonText = isPro ? 'Current Plan' : 'Upgrade to Pro'
            dynamicPlan.buttonVariant = isPro ? 'outline' : 'primary'
          }

          return (
            <PricingCard
              key={dynamicPlan.name}
              plan={dynamicPlan}
              index={index}
              onCurrentPlanClick={handleCurrentPlanClick}
              onUpgradeClick={handleUpgradeClick}
              onContactSalesClick={handleContactSalesClick}
            />
          )
        })}
      </div>

      {/* Contact Sales Form Modal */}
      <ContactSalesModal
        isOpen={isContactSalesOpen}
        onClose={() => setIsContactSalesOpen(false)}
      />
    </div>
  )
}

export default PricingPage
