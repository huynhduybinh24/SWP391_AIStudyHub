import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Building2, Mail, MessageSquare, User } from 'lucide-react'

const contactSalesSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  organization: z.string().min(1, 'Organization is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactSalesFormValues = z.infer<typeof contactSalesSchema>

interface ContactSalesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactSalesModal({ isOpen, onClose }: ContactSalesModalProps) {
  const toast = useToast()
  
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
    toast.success('Sales team will contact you soon')
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
      title="Contact Sales"
      description="Tell us about your organization or university department and our team will prepare a custom proposal."
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Name input */}
        <div className="space-y-1">
          <label htmlFor="sales-name" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Full Name *
          </label>
          <Input
            id="sales-name"
            placeholder="John Doe"
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
            Work Email *
          </label>
          <Input
            id="sales-email"
            type="email"
            placeholder="john.doe@university.edu"
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
            Organization / University *
          </label>
          <Input
            id="sales-organization"
            placeholder="FPT University / Department of CS"
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
            How can we help you? *
          </label>
          <Textarea
            id="sales-message"
            placeholder="Include details about your team size, requirements, and study goals..."
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
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#3155F6] hover:bg-[#2563eb] text-white rounded-xl font-semibold min-w-[120px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
