import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { LinkedAccountCard, LinkedAccount } from './LinkedAccountCard'
import { LinkedAccountLoginModal } from './LinkedAccountLoginModal'
import { LinkedAccountManageModal } from './LinkedAccountManageModal'
import { ConfirmModal } from './ConfirmModal'
import { useTranslation } from '@/context/LanguageContext'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/axios'

const defaultLinkedAccounts: LinkedAccount[] = [
  {
    id: 'google',
    provider: 'Google',
    email: '',
    connected: false,
    connectedAt: null,
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
  const { t } = useTranslation()
  const toast = useToast()
  const authUser = useAuthStore((s) => s.user)

  // State Management according to specification
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>(defaultLinkedAccounts)
  const [selectedAccount, setSelectedAccount] = useState<LinkedAccount | null>(null)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [manageModalOpen, setManageModalOpen] = useState(false)
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false)

  // Fetch linked accounts from the database on mount/user change
  useEffect(() => {
    if (!authUser || !authUser.id) return

    const fetchLinkedAccounts = async () => {
      try {
        const response = await apiClient.get<any[]>(`/users/${authUser.id}/linked-accounts`)
        const googleLink = response.data.find((tp) => tp.providerType === 'GOOGLE')
        const microsoftLink = response.data.find((tp) => tp.providerType === 'MICROSOFT')

        setLinkedAccounts([
          {
            id: 'google',
            provider: 'Google',
            email: googleLink ? googleLink.providerEmail : '',
            connected: !!googleLink,
            connectedAt: googleLink ? googleLink.linkedAt?.split('T')[0] : null,
            permissions: ['Read profile', 'Access files', 'Sync data'],
            lastSync: null,
          },
          {
            id: 'microsoft',
            provider: 'Microsoft',
            email: microsoftLink ? microsoftLink.providerEmail : '',
            connected: !!microsoftLink,
            connectedAt: microsoftLink ? microsoftLink.linkedAt?.split('T')[0] : null,
            permissions: ['Read profile', 'Access files', 'Sync data'],
            lastSync: null,
          },
        ])
      } catch (err) {
        console.error('Failed to fetch linked accounts:', err)
      }
    }

    fetchLinkedAccounts()
  }, [authUser])

  // Handle opening connection login modal or redirecting to Google OAuth
  const handleConnectClick = (account: LinkedAccount) => {
    if (account.id === 'google') {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '299923810846-kfk4pv295irthtmvfdpuj91gijqkilmh.apps.googleusercontent.com'
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback')
      
      if (clientId.includes('dummy')) {
        window.location.href = `${window.location.origin}/auth/callback?code=mock-google-code-123456&state=link_account`
        return
      }
      
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&prompt=select_account&state=link_account`
    } else {
      setSelectedAccount(account)
      setLoginModalOpen(true)
    }
  }

  // Handle connection success from login modal (e.g. for Microsoft mock flow)
  const handleConnectSuccess = async (email: string) => {
    if (!selectedAccount || !authUser || !authUser.id) return

    try {
      await apiClient.post(`/users/${authUser.id}/linked-accounts`, {
        code: 'mock-microsoft-code',
        redirectUri: window.location.origin + '/auth/callback',
        provider: selectedAccount.id.toUpperCase(),
      })

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
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect account.')
    }

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
  const handleConfirmDisconnect = async () => {
    if (!selectedAccount || !authUser || !authUser.id) return

    try {
      await apiClient.delete(`/users/${authUser.id}/linked-accounts/${selectedAccount.id.toUpperCase()}`)

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
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect account.')
    }

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
