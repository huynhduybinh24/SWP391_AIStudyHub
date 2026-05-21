import { useState } from 'react'
import { Shield, Key } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { Button } from '@/components/ui/Button'
import { ChangePasswordModal } from './ChangePasswordModal'
import { TwoFactorModal } from './TwoFactorModal'

export function SecurityCard() {
  const { security, toggleTwoFactor } = useSettingsStore()
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [is2faModalOpen, setIs2faModalOpen] = useState(false)

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

      {/* Two-Factor Authentication Setup Modal */}
      <TwoFactorModal
        isOpen={is2faModalOpen}
        onClose={() => setIs2faModalOpen(false)}
      />
    </div>
  )
}
