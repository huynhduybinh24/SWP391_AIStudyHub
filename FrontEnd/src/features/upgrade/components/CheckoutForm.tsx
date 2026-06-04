import { useState, useEffect, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, HelpCircle, Lock, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaymentInput } from './PaymentInput'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { apiClient } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'

interface CheckoutFormProps {
  selectedProvider: 'apple' | 'google' | 'paypal' | 'momo' | null
  onFocusCard: () => void
  onSuccess: (method: 'Credit Card' | 'Apple Pay' | 'Google Pay' | 'PayPal' | 'MoMo') => void
}

type CheckoutFormValues = {
  cardholderName: string
  cardNumber: string
  expiryDate: string
  cvv: string
}

export function CheckoutForm({
  selectedProvider,
  onFocusCard,
  onSuccess,
}: CheckoutFormProps) {
  const toast = useToast()
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [isPaying, setIsPaying] = useState(false)
  const [showCvvHelp, setShowCvvHelp] = useState(false)
  const helpRef = useRef<HTMLDivElement>(null)

  // Dynamically localized validation schema
  const checkoutSchema = useMemo(() => {
    return z.object({
      cardholderName: z.string().min(1, t.upgrade.cardholderNameRequired),
      cardNumber: z
        .string()
        .min(1, t.upgrade.cardNumberRequired)
        .refine((val) => val.replace(/\s/g, '').length === 16, {
          message: t.upgrade.cardNumberDigits,
        }),
      expiryDate: z
        .string()
        .min(1, t.upgrade.expiryDateRequired)
        .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, t.upgrade.expiryDateFormat),
      cvv: z
        .string()
        .min(1, t.upgrade.cvvRequired)
        .regex(/^\d{3,4}$/, t.upgrade.cvvDigits),
    })
  }, [t])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      cardholderName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
  })

  // Format card number (xxxx xxxx xxxx xxxx)
  const formatCardNumber = (value: string) => {
    const clean = value.replace(/\D/g, '')
    const sliced = clean.slice(0, 16)
    return sliced.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value: string) => {
    const clean = value.replace(/\D/g, '')
    const sliced = clean.slice(0, 4)
    if (sliced.length > 2) {
      return `${sliced.slice(0, 2)}/${sliced.slice(2)}`
    }
    return sliced
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatCardNumber(e.target.value)
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatExpiryDate(e.target.value)
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4)
  }

  const handleFocus = () => {
    if (selectedProvider !== null) {
      onFocusCard()
    }
  }

  // Close CVV help box on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setShowCvvHelp(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Submission handler for Card Payment (with Zod validation)
  const onSubmitCard = async (data: CheckoutFormValues) => {
    setIsPaying(true)
    console.log('Payment simulated processing with Card data: ', data)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success(t.upgrade.paymentSuccessToast)
      onSuccess('Credit Card')
      reset()
    } catch (err) {
      console.error(err)
    } finally {
      setIsPaying(false)
    }
  }

  // Submission handler for Express Checkout (bypassing validation)
  const onSubmitExpress = async () => {
    setIsPaying(true)
    const providerNames = {
      apple: 'Apple Pay',
      google: 'Google Pay',
      paypal: 'PayPal',
      momo: 'MoMo',
    }
    const methodName = selectedProvider ? providerNames[selectedProvider] : 'PayPal'

    if (selectedProvider === 'momo') {
      try {
        const response = await apiClient.post('/billing/checkout', {
          userId: user ? parseInt(user.id, 10) : 1,
          planId: 2,  // Seeded Pro Plan
          paymentMethod: 'MOMO'
        })
        const { paymentUrl } = response.data
        if (paymentUrl) {
          window.location.href = paymentUrl
        } else {
          toast.error('Không tìm thấy link thanh toán MoMo')
        }
      } catch (err: any) {
        console.error(err)
        toast.error(err.message || 'Lỗi kết nối tạo link thanh toán MoMo')
      } finally {
        setIsPaying(false)
      }
      return
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success(t.upgrade.paymentSuccessToast)
      onSuccess(methodName as any)
    } catch (err) {
      console.error(err)
    } finally {
      setIsPaying(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedProvider !== null) {
      onSubmitExpress()
    } else {
      handleSubmit(onSubmitCard)(e)
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      {/* Cardholder Name */}
      <PaymentInput
        label={t.upgrade.cardholderNameLabel}
        type="text"
        placeholder={t.upgrade.cardholderNamePlaceholder}
        disabled={isPaying}
        error={errors.cardholderName?.message}
        {...register('cardholderName')}
        onFocus={handleFocus}
      />

      {/* Card Number */}
      <PaymentInput
        label={t.upgrade.cardNumberLabel}
        type="text"
        placeholder="0000 0000 0000 0000"
        maxLength={19} // 16 digits + 3 spaces
        disabled={isPaying}
        leftIcon={<CreditCard className="size-4 text-slate-400" />}
        error={errors.cardNumber?.message}
        {...register('cardNumber', { onChange: handleCardNumberChange })}
        onFocus={handleFocus}
      />

      {/* Row: Expiry + CVV */}
      <div className="grid grid-cols-2 gap-4">
        {/* Expiry Date */}
        <PaymentInput
          label={t.upgrade.expiryDateLabel}
          type="text"
          placeholder="MM/YY"
          maxLength={5} // MM/YY
          disabled={isPaying}
          error={errors.expiryDate?.message}
          {...register('expiryDate', { onChange: handleExpiryChange })}
          onFocus={handleFocus}
        />

        {/* CVV Input & Interactive Help Popover */}
        <div className="relative" ref={helpRef}>
          <PaymentInput
            label="CVV"
            type="text"
            placeholder="123"
            maxLength={4}
            disabled={isPaying}
            rightIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCvvHelp(!showCvvHelp)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
              >
                <HelpCircle className="size-4" />
              </button>
            }
            error={errors.cvv?.message}
            {...register('cvv', { onChange: handleCvvChange })}
            onFocus={handleFocus}
          />
          <AnimatePresence>
            {showCvvHelp && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 bottom-full mb-2.5 z-20 w-64 bg-slate-900 dark:bg-slate-800 text-white dark:text-white border border-slate-800 dark:border-slate-700 rounded-xl p-3 text-[11px] font-semibold shadow-xl leading-relaxed text-left"
              >
                <div className="absolute right-3.5 top-full w-2.5 h-2.5 bg-slate-900 dark:bg-slate-800 border-r border-b border-slate-800 dark:border-slate-700 rotate-45 -mt-1.5" />
                {t.upgrade.cvvHelpLabel}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPaying}
        className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 select-none active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[#2563eb]/15 hover:shadow-lg hover:shadow-[#2563eb]/20 disabled:pointer-events-none disabled:opacity-75 mt-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563eb]"
      >
        {isPaying ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t.upgrade.processing}
          </>
        ) : (
          <>
            <Lock className="size-4" />
            {t.upgrade.payAmountBtn('200.000đ')}
          </>
        )}
      </button>
    </form>
  )
}
