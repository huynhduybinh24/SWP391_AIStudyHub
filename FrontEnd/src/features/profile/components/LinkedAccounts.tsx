import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { LinkedAccountCard, LinkedAccount } from './LinkedAccountCard'
import { LinkedAccountLoginModal } from './LinkedAccountLoginModal'
import { LinkedAccountManageModal } from './LinkedAccountManageModal'
import { ConfirmModal } from './ConfirmModal'
import { useTranslation } from '@/context/LanguageContext'

const defaultLinkedAccounts: LinkedAccount[] = [
  {
    id: 'google',
    provider: 'Google',
    email: 'alex.rivera@gmail.com',
    connected: true,
    connectedAt: '2024-01-12',
    permissions: ['Read profile', 'Access files', 'Sync data'],
    lastSync: null,
  },
  {
    id: 'microsoft',
    provider: 'Microsoft',
    email: '',
    connected: false,
    connectedAt: null,
    permissions: ['Read profile', 'Access files', 'Sync data'],
    lastSync: null,
  },
]

export function LinkedAccounts() {
  const { t, language } = useTranslation()
  const toast = useToast()

  // State Management according to specification
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>(defaultLinkedAccounts)
  const [selectedAccount, setSelectedAccount] = useState<LinkedAccount | null>(null)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [manageModalOpen, setManageModalOpen] = useState(false)
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false)

  // Handle opening connection login modal
  const handleConnectClick = (account: LinkedAccount) => {
    setSelectedAccount(account)
    setLoginModalOpen(true)
  }

  // Handle connection success from login modal
  const handleConnectSuccess = (email: string) => {
    if (!selectedAccount) return

    const todayStr = new Date().toISOString().split('T')[0]

    setLinkedAccounts((prev) =>
      prev.map((acc) =>
        acc.id === selectedAccount.id
          ? {
              ...acc,
              connected: true,
              email,
              connectedAt: todayStr,
              lastSync: null,
            }
          : acc
      )
    )

    toast.success(t.profile.toastAccountConnected(selectedAccount.provider))
    setLoginModalOpen(false)
    setSelectedAccount(null)
  }

  // Handle opening manage modal
  const handleManageClick = (account: LinkedAccount) => {
    setSelectedAccount(account)
    setManageModalOpen(true)
  }

  // Handle sync now action in manage modal
  const handleSync = async () => {
    if (!selectedAccount) return

    // Simulate 1s delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const nowStr = new Date().toLocaleString()

    setLinkedAccounts((prev) =>
      prev.map((acc) =>
        acc.id === selectedAccount.id
          ? {
              ...acc,
              lastSync: nowStr,
            }
          : acc
      )
    )

    // Update selectedAccount to display the new sync time in current modal open session
    setSelectedAccount((prev) => (prev ? { ...prev, lastSync: nowStr } : null))

    toast.success(t.profile.toastAccountSynced(selectedAccount.provider))
  }

  // Handle click disconnect from manage modal
  const handleDisconnectClick = () => {
    setDisconnectConfirmOpen(true)
  }

  // Handle confirming disconnection
  const handleConfirmDisconnect = () => {
    if (!selectedAccount) return

    setLinkedAccounts((prev) =>
      prev.map((acc) =>
        acc.id === selectedAccount.id
          ? {
              ...acc,
              connected: false,
              email: '',
              connectedAt: null,
              lastSync: null,
            }
          : acc
      )
    )

    toast.success(t.profile.toastAccountDisconnected(selectedAccount.provider))
    setDisconnectConfirmOpen(false)
    setManageModalOpen(false)
    setSelectedAccount(null)
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-6">
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
        {t.profile.linkedAccountsTitle}
      </h3>
      <div className="space-y-4">
        {linkedAccounts.map((account) => (
          <LinkedAccountCard
            key={account.id}
            account={account}
            onConnect={handleConnectClick}
            onManage={handleManageClick}
          />
        ))}
      </div>

      {/* LinkedAccountLoginModal */}
      <LinkedAccountLoginModal
        isOpen={loginModalOpen}
        onClose={() => {
          setLoginModalOpen(false)
          setSelectedAccount(null)
        }}
        account={selectedAccount}
        onConnectSuccess={handleConnectSuccess}
      />

      {/* LinkedAccountManageModal */}
      <LinkedAccountManageModal
        isOpen={manageModalOpen}
        onClose={() => {
          setManageModalOpen(false)
          setSelectedAccount(null)
        }}
        account={selectedAccount}
        onSync={handleSync}
        onDisconnectClick={handleDisconnectClick}
      />

      {/* ConfirmModal for Disconnection */}
      <ConfirmModal
        isOpen={disconnectConfirmOpen}
        onClose={() => setDisconnectConfirmOpen(false)}
        onConfirm={handleConfirmDisconnect}
        title={t.profile.disconnectTitle}
        description={t.profile.disconnectConfirm(selectedAccount?.provider || '')}
        confirmText={t.profile.disconnectBtn}
        cancelText={t.common.cancel}
      />
    </div>
  )
}
