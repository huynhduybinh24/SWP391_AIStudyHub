import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PricingCard, type PricingPlan } from '../components/PricingCard'
import { ContactSalesModal } from '../components/ContactSalesModal'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/stores/authStore'

const pricingPlans: PricingPlan[] = [
  {
    name: 'Free Plan',
    price: '$0',
    billing: '/month',
    description: 'For casual learners needing basic assistance.',
    features: [
      'Core storage (10GB)',
      'Basic AI summaries (10/mo)',
      'Standard study plans',
    ],
    buttonText: 'Current Plan',
    buttonVariant: 'outline',
    isCurrent: true,
  },
  {
    name: 'Pro Plan',
    price: '$12.00',
    billing: '/month',
    yearlySavingText: 'Or $120/year (Save 16%)',
    description: 'For dedicated students requiring intensive tools.',
    features: [
      'Unlimited AI summaries',
      'Deep-dive chatbot access',
      '50GB Cloud storage',
      'Advanced study analytics',
      'Priority support',
    ],
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'primary',
    popular: true,
  },
  {
    name: 'Institutional',
    price: 'Custom',
    description: 'For study groups, departments, or universities.',
    features: [
      'Everything in Pro',
      'Centralized billing',
      'Admin dashboard',
      'Dedicated success manager',
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'secondary',
  },
]

export function PricingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false)

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
          Choose Your Plan
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Unlock the full potential of AI-powered academic success. Choose the tier that matches your study intensity.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch w-full max-w-5xl mt-6 px-4">
        {pricingPlans.map((plan, index) => {
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
