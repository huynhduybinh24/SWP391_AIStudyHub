import { useState, useEffect } from 'react'
import { Cloud, Link2, Link2Off, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import {
  getGoogleDriveStatus,
  connectGoogleDrive,
  disconnectGoogleDrive,
  type GoogleDriveStatus
} from '../services/googleDriveService'

export function GoogleDriveCard() {
  const { t, language } = useTranslation()
  const [status, setStatus] = useState<GoogleDriveStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const toast = useToast()

  const fetchStatus = async () => {
    try {
      const data = await getGoogleDriveStatus()
      setStatus(data)
    } catch (err: any) {
      console.error('Failed to load Google Drive status:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Handle redirect parameters (success or error)
    const params = new URLSearchParams(window.location.search)
    const connectedParam = params.get('googleDriveConnected')
    const errorParam = params.get('error')

    if (connectedParam === 'true') {
      toast.success(
        language === 'vi'
          ? 'Kết nối Google Drive thành công!'
          : 'Google Drive connected successfully!'
      )
      // Clean query params
      params.delete('googleDriveConnected')
      const newSearch = params.toString()
      const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`
      window.history.replaceState({}, '', newUrl)
    } else if (errorParam) {
      toast.error(errorParam)
      params.delete('error')
      const newSearch = params.toString()
      const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`
      window.history.replaceState({}, '', newUrl)
    }
  }, [language])

  const handleConnect = async () => {
    setActionLoading(true)
    try {
      await connectGoogleDrive()
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate Google Drive connection')
      setActionLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setActionLoading(true)
    try {
      await disconnectGoogleDrive()
      toast.success(
        language === 'vi'
          ? 'Đã ngắt kết nối Google Drive.'
          : 'Google Drive disconnected successfully.'
      )
      await fetchStatus()
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect Google Drive')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 shadow-sm flex items-center justify-center h-48">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  const isConnected = !!status?.connected

  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 border-b border-border/60 dark:border-slate-800/80 pb-4 mb-6">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#E5EEFF] dark:bg-blue-950/50 text-[#2563EB]">
            <Cloud className="size-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground dark:text-slate-100">
            {t.settings.googleDriveTitle}
          </h2>
        </div>

        <div className="space-y-6">
          {/* Status Row */}
          <div className="space-y-3 pb-6 border-b border-border/40 dark:border-slate-800/40">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground dark:text-slate-200">
                  {t.settings.googleDriveStatus}
                </h3>
                <p className="text-xs text-muted dark:text-slate-400 mt-1">
                  {t.settings.googleDriveDesc}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isConnected
                    ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                }`}
              >
                {isConnected
                  ? t.settings.googleDriveConnected
                  : t.settings.googleDriveDisconnected}
              </span>
            </div>
          </div>

          {/* Connected Email Row (if connected) */}
          {isConnected && status?.googleEmail && (
            <div className="space-y-1.5 pb-2">
              <h4 className="text-xs font-semibold text-muted dark:text-slate-400 uppercase tracking-wider">
                {t.settings.googleDriveConnectedEmail}
              </h4>
              <p className="text-sm font-medium text-foreground dark:text-slate-200 break-all bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-border/50 dark:border-slate-800/50">
                {status.googleEmail}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        {isConnected ? (
          <Button
            type="button"
            className="w-full text-xs font-semibold py-2.5 bg-red-600 hover:bg-red-750 text-white flex items-center justify-center gap-2"
            disabled={actionLoading}
            onClick={handleDisconnect}
          >
            {actionLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Link2Off className="size-3.5" />
            )}
            {t.settings.googleDriveDisconnectBtn}
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full text-xs font-semibold py-2.5 bg-[#e5eeff] dark:bg-blue-950/40 hover:bg-[#d0e1ff] dark:hover:bg-blue-950/60 text-[#2563eb] dark:text-blue-400 border-none flex items-center justify-center gap-2"
            disabled={actionLoading}
            onClick={handleConnect}
          >
            {actionLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Link2 className="size-3.5" />
            )}
            {t.settings.googleDriveConnectBtn}
          </Button>
        )}
      </div>
    </div>
  )
}
