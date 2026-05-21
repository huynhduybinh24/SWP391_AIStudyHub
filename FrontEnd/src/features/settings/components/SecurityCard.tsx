import { useState } from 'react'
import { Shield, Key, AlertTriangle } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ChangePasswordModal } from './ChangePasswordModal'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const tfaSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
})

type TfaFormValues = z.infer<typeof tfaSchema>

export function SecurityCard() {
  const { security, toggleTwoFactor } = useSettingsStore()
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [is2faModalOpen, setIs2faModalOpen] = useState(false)

  // React Hook Form for 2FA Verification
  const {
    register: registerTfa,
    handleSubmit: handleSubmitTfa,
    formState: { errors: tfaErrors },
    reset: resetTfa,
  } = useForm<TfaFormValues>({
    resolver: zodResolver(tfaSchema),
  })

  const onSubmit2fa = (data: TfaFormValues) => {
    console.log('2FA Code submitted', data)
    toggleTwoFactor()
    setIs2faModalOpen(false)
    resetTfa()
  }

  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 border-b border-border/60 dark:border-slate-800/80 pb-4 mb-6">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#E5EEFF] dark:bg-blue-950/50 text-[#2563EB]">
            <Shield className="size-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground dark:text-slate-100">Security</h2>
        </div>

        <div className="space-y-6">
          {/* Password Row */}
          <div className="space-y-3 pb-6 border-b border-border/40 dark:border-slate-800/40">
            <div>
              <h3 className="text-sm font-semibold text-foreground dark:text-slate-200">Password</h3>
              <p className="text-xs text-muted dark:text-slate-400">Last changed {security.lastPasswordChanged}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full text-xs font-semibold text-[#1e293b] dark:text-slate-200 bg-[#f1f5f9] dark:bg-slate-800 hover:bg-[#e2e8f0] dark:hover:bg-slate-700 border-none flex items-center justify-center gap-2 py-2"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              <Key className="size-3.5" />
              Change Password
            </Button>
          </div>

          {/* 2FA Row */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground dark:text-slate-200">Two-Factor Auth</h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  security.isTwoFactorEnabled
                    ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                }`}
              >
                {security.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-muted dark:text-slate-400 leading-normal">
              Add an extra layer of security to your account.
            </p>
            <Button
              type="button"
              className={`w-full text-xs font-semibold py-2.5 ${
                security.isTwoFactorEnabled
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-[#e5eeff] dark:bg-blue-950/40 hover:bg-[#d0e1ff] dark:hover:bg-blue-950/60 text-[#2563eb] dark:text-blue-400 border-none'
              }`}
              onClick={() => {
                if (security.isTwoFactorEnabled) {
                  toggleTwoFactor()
                } else {
                  setIs2faModalOpen(true)
                }
              }}
            >
              {security.isTwoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={is2faModalOpen}
        onClose={() => {
          setIs2faModalOpen(false)
          resetTfa()
        }}
        title="Setup Two-Factor Authentication"
        description="Verify your device to enable extra protection."
        className="max-w-md dark:bg-slate-900 dark:border-slate-800"
      >
        <form onSubmit={handleSubmitTfa(onSubmit2fa)} className="space-y-6">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-border dark:border-slate-800 text-center">
            {/* Mock QR Code */}
            <div className="size-36 bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
              <svg className="size-full text-slate-900" viewBox="0 0 100 100">
                <rect x="0" y="0" width="100" height="100" fill="none" />
                {/* Outer anchor points */}
                <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                <rect x="10" y="10" width="15" height="15" fill="white" />
                <rect x="13" y="13" width="9" height="9" fill="currentColor" />

                <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                <rect x="75" y="10" width="15" height="15" fill="white" />
                <rect x="78" y="13" width="9" height="9" fill="currentColor" />

                <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                <rect x="10" y="75" width="15" height="15" fill="white" />
                <rect x="13" y="78" width="9" height="9" fill="currentColor" />

                {/* Random QR bits */}
                <rect x="35" y="5" width="10" height="5" fill="currentColor" />
                <rect x="55" y="10" width="5" height="15" fill="currentColor" />
                <rect x="35" y="20" width="20" height="5" fill="currentColor" />
                <rect x="40" y="40" width="15" height="15" fill="currentColor" />
                <rect x="70" y="35" width="10" height="10" fill="currentColor" />
                <rect x="85" y="50" width="10" height="10" fill="currentColor" />
                <rect x="35" y="70" width="5" height="25" fill="currentColor" />
                <rect x="50" y="80" width="20" height="15" fill="currentColor" />
                <rect x="80" y="80" width="15" height="15" fill="currentColor" />
              </svg>
            </div>
            <div className="mt-3">
              <span className="text-[10px] uppercase font-bold text-muted dark:text-slate-500 tracking-wider">Secret Key</span>
              <p className="text-sm font-mono font-bold text-foreground dark:text-white">JBSW Y3DP EHPK 3PXP</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground dark:text-slate-350 flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-amber-500" />
              Enter 6-digit Authenticator Code
            </label>
            <Input
              type="text"
              placeholder="e.g. 123456"
              maxLength={6}
              error={tfaErrors.code?.message}
              {...registerTfa('code')}
              className="text-center font-mono text-lg tracking-[0.5em] bg-transparent dark:text-white dark:border-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/60 dark:border-slate-800/80">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIs2faModalOpen(false)
                resetTfa()
              }}
              className="dark:bg-slate-800 dark:text-white dark:border-slate-700"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2563eb] text-white">
              Verify & Enable
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
