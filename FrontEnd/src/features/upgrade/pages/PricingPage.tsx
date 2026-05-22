import { PricingCard, type PricingPlan } from '../components/PricingCard'

const pricingPlans: PricingPlan[] = [
  {
    name: 'Free Plan',
    price: '$0',
    billing: '/month',
    description: 'For casual learners needing basic assistance.',
    features: [
      'Core storage (5GB)',
      'Basic AI summaries (10/mo)',
      'Standard study plans',
    ],
    buttonText: 'Current Plan',
    buttonVariant: 'outline',
    isCurrent: true,
  },
  {
    name: 'Pro Plan',
    price: '$120.00',
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
  return (
    <div className="space-y-10 py-4 flex flex-col items-center">
      {/* Title & Subtitle */}
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Choose Your Plan
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Unlock the full potential of AI-powered academic success. Choose the tier that matches your study intensity.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch w-full max-w-5xl mt-6">
        {pricingPlans.map((plan, index) => (
          <PricingCard key={plan.name} plan={plan} index={index} />
        ))}
      </div>
    </div>
  )
}

export default PricingPage
