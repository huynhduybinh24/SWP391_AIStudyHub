import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Building2, Mail, User } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface ContactSalesFormValues {
  name: string
  email: string
  organization: string
  message: string
}

interface ContactSalesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactSalesModal({ isOpen, onClose }: ContactSalesModalProps) {
  const toast = useToast()
  const { t } = useTranslation()
  
  const contactSalesSchema = useMemo(() => z.object({
    name: z.string().min(1, t.validation.nameRequired || 'Name is required'),
    email: z.string().min(1, t.validation.emailRequired || 'Email address is required').email(t.validation.invalidEmail || 'Please enter a valid email address'),
    organization: z.string().min(1, t.validation.nameRequired || 'Organization is required'),
    message: z.string().min(10, t.validation.passwordMinLength || 'Message must be at least 10 characters'),
  }), [t])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactSalesFormValues>({
    resolver: zodResolver(contactSalesSchema),
    defaultValues: {
      name: '',
      email: '',
      organization: '',
      message: '',
    },
  })

  const onSubmit = async (data: ContactSalesFormValues) => {
    // Simulate API request delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    console.log('Contact Sales Data:', data)
    toast.success(t.upgrade.salesSuccessToast || 'Sales team will contact you soon')
    reset()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset()
        onClose()
      }}
      title={t.upgrade.contactSalesTitle || "Contact Sales"}
      description={t.upgrade.contactSalesDesc || "Tell us about your organization or university department."}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Name input */}
        <div className="space-y-1">
          <label htmlFor="sales-name" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.upgrade.fullNameLabel || "Full Name *"}
          </label>
          <Input
            id="sales-name"
            placeholder={t.upgrade.fullNamePlaceholder || "John Doe"}
            startIcon={<User className="size-4 text-slate-400" />}
            error={errors.name?.message}
            {...register('name')}
            className="bg-[#f8f9ff]/50 dark:bg-slate-900 border-border/80 dark:border-slate-800 rounded-xl py-2.5"
            aria-label="Full Name"
          />
        </div>

        {/* Email input */}
        <div className="space-y-1">
          <label htmlFor="sales-email" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.upgrade.workEmailLabel || "Work Email *"}
          </label>
          <Input
            id="sales-email"
            type="email"
            placeholder={t.upgrade.workEmailPlaceholder || "john.doe@university.edu"}
            startIcon={<Mail className="size-4 text-slate-400" />}
            error={errors.email?.message}
            {...register('email')}
            className="bg-[#f8f9ff]/50 dark:bg-slate-900 border-border/80 dark:border-slate-800 rounded-xl py-2.5"
            aria-label="Work Email"
          />
        </div>

        {/* Organization input */}
        <div className="space-y-1">
          <label htmlFor="sales-organization" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.upgrade.orgLabel || "Organization / University *"}
          </label>
          <Input
            id="sales-organization"
            placeholder={t.upgrade.orgPlaceholder || "FPT University / Department of CS"}
            startIcon={<Building2 className="size-4 text-slate-400" />}
            error={errors.organization?.message}
            {...register('organization')}
            className="bg-[#f8f9ff]/50 dark:bg-slate-900 border-border/80 dark:border-slate-800 rounded-xl py-2.5"
            aria-label="Organization or University"
          />
        </div>

        {/* Message input */}
        <div className="space-y-1">
          <label htmlFor="sales-message" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.upgrade.helpMessageLabel || "How can we help you? *"}
          </label>
          <Textarea
            id="sales-message"
            placeholder={t.upgrade.helpMessagePlaceholder || "Include details about your team size, requirements, and study goals..."}
            error={errors.message?.message}
            {...register('message')}
            className="bg-[#f8f9ff]/50 dark:bg-slate-900 border-border/80 dark:border-slate-800 rounded-xl p-3 text-sm min-h-[100px]"
            aria-label="Message details"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset()
              onClose()
            }}
            className="rounded-xl border border-border dark:border-slate-800"
            disabled={isSubmitting}
          >
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            className="bg-[#3155F6] hover:bg-[#2563eb] text-white rounded-xl font-semibold min-w-[120px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (t.upgrade.sendingBtn || 'Sending...') : (t.upgrade.submitRequestBtn || 'Submit Request')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
