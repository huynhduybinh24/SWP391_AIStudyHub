import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { ExpressCheckout } from '../components/ExpressCheckout'
import { CheckoutForm } from '../components/CheckoutForm'
import { OrderSummary } from '../components/OrderSummary'
import { PaymentSuccessModal } from '../components/PaymentSuccessModal'
import { ExpressCheckoutModal } from '../components/ExpressCheckoutModal'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'

export function CheckoutPage() {
  const toast = useToast()
  const { t } = useTranslation()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'apple' | 'google' | 'paypal' | null>('paypal')
  const [paymentMethod, setPaymentMethod] = useState<'Apple Pay' | 'Google Pay' | 'PayPal' | 'Credit Card'>('PayPal')
  
  // Express Checkout confirmation modal states
  const [showExpressConfirmModal, setShowExpressConfirmModal] = useState(false)
  const [expressConfirmProvider, setExpressConfirmProvider] = useState<'apple' | 'google' | 'paypal'>('paypal')

  const handleSelectExpressProvider = (provider: 'apple' | 'google' | 'paypal') => {
    const providerNames = {
      apple: 'Apple Pay',
      google: 'Google Pay',
      paypal: 'PayPal',
    }

    setSelectedProvider(provider)
    toast.info(t.upgrade.toastProviderSelected(providerNames[provider]))
    setExpressConfirmProvider(provider)
    setShowExpressConfirmModal(true)
  }

  const handleClearExpressSelection = () => {
    setSelectedProvider(null)
  }

  const handlePaymentSuccess = (method: 'Credit Card' | 'Apple Pay' | 'Google Pay' | 'PayPal') => {
    setPaymentMethod(method)
    setShowSuccessModal(true)
  }

  const handleExpressConfirm = () => {
    setShowExpressConfirmModal(false)
    const providerNames = {
      apple: 'Apple Pay' as const,
      google: 'Google Pay' as const,
      paypal: 'PayPal' as const,
    }
    handlePaymentSuccess(providerNames[expressConfirmProvider])
  }

  return (
    <div className="min-h-[80vh] py-6 flex flex-col justify-center items-center bg-[#f8fafc] dark:bg-slate-950 p-2 md:p-8 rounded-2xl transition-colors duration-300">
      <motion.div
        key="checkout-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[1000px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[560px]">
          {/* Left Column: Card Form (7 of 12 columns) */}
          <div className="lg:col-span-7 p-6 md:p-10 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Back to Plans Link */}
              <Link
                to="/dashboard/upgrade"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#2563eb] dark:text-slate-500 dark:hover:text-blue-400 no-underline transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                {t.upgrade.backToPlans}
              </Link>

              {/* Title & Subtitle */}
              <div className="space-y-1.5">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t.upgrade.secureCheckout}
                </h1>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {t.upgrade.secureCheckoutDesc}
                </p>
              </div>

              {/* Express Payment Integration */}
              <ExpressCheckout
                selectedProvider={selectedProvider}
                onSelectProvider={handleSelectExpressProvider}
              />

              {/* Styled Section Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200/50 dark:border-slate-800/60" />
                <span className="flex-shrink mx-4 text-[9px] font-black text-slate-400 dark:text-slate-400 tracking-widest uppercase">
                  {t.upgrade.orPayWithCard}
                </span>
                <div className="flex-grow border-t border-slate-200/50 dark:border-slate-800/60" />
              </div>

              {/* Card Form */}
              <CheckoutForm
                selectedProvider={selectedProvider}
                onFocusCard={handleClearExpressSelection}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          </div>

          {/* Right Column: Order Summary (5 of 12 columns) */}
          <div className="lg:col-span-5 bg-slate-50/40 dark:bg-slate-950/20 border-t lg:border-t-0 lg:border-l border-slate-200/60 dark:border-slate-800/60 p-6 md:p-10">
            <OrderSummary />
          </div>
        </div>
      </motion.div>

      {/* Payment Success Overlay Modal */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        planName={t.upgrade.proPlanAnnual}
        transactionId="#ASH-9284751"
        amount="$132.00"
        paymentMethod={paymentMethod}
      />

      {/* Express Payment Confirmation Modal */}
      <ExpressCheckoutModal
        open={showExpressConfirmModal}
        onClose={() => setShowExpressConfirmModal(false)}
        provider={expressConfirmProvider}
        amount={132.00}
        onConfirm={handleExpressConfirm}
      />
    </div>
  )
}

export default CheckoutPage
