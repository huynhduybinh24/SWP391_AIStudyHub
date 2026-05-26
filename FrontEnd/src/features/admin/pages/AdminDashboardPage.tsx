import { useState, useEffect } from 'react'
import { Shield, Users, BarChart3, Loader2, AlertCircle, RefreshCw, CreditCard, Bell, TrendingUp, ClipboardList, AlertTriangle, Cpu } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useSearchParams } from 'react-router-dom'
import { AdminOverviewTab } from '@/features/admin/components/AdminOverviewTab'
import { AdminDocumentsTab } from '@/features/admin/components/AdminDocumentsTab'
import { AdminUsersTab } from '@/features/admin/components/AdminUsersTab'
import { AdminPackagesTab } from '@/features/admin/components/AdminPackagesTab'
import { AdminNotificationsTab } from '@/features/admin/components/AdminNotificationsTab'
import { AdminAnalyticsTab } from '@/features/admin/components/AdminAnalyticsTab'
import { AdminLogsTab } from '@/features/admin/components/AdminLogsTab'
import { AdminReportsTab } from '@/features/admin/components/AdminReportsTab'
import { adminService, AdminStats, AdminUser, AdminDocument } from '../services/adminService'

type AdminTab = 'overview' | 'users' | 'packages' | 'notifications' | 'documents' | 'analytics' | 'activity-logs' | 'reports' | 'ai-moderation'

export function AdminDashboardPage() {
  const { t, language } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as AdminTab) || 'overview'

  const setActiveTab = (tab: AdminTab) => {
    setSearchParams({ tab })
  }

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminService.getDashboardSummary()
      setStats(data.stats)
      setUsers(data.users)
      setDocuments(data.documents)
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu admin.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleUpdateUser = async (userId: string, updates: Partial<AdminUser>) => {
    try {
      const updated = await adminService.updateUser(userId, updates)
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminService.deleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateDocument = async (documentId: string, updates: Partial<AdminDocument>) => {
    try {
      const updated = await adminService.updateDocument(documentId, updates)
      setDocuments((prev) => prev.map((d) => (d.id === documentId ? updated : d)))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await adminService.deleteDocument(documentId)
      setDocuments((prev) => prev.filter((d) => d.id !== documentId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleApproveDocument = async (documentId: string) => {
    try {
      const updated = await adminService.approveDocument(documentId)
      setDocuments((prev) => prev.map((d) => (d.id === documentId ? updated : d)))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRejectDocument = async (documentId: string) => {
    try {
      const updated = await adminService.rejectDocument(documentId)
      setDocuments((prev) => prev.map((d) => (d.id === documentId ? updated : d)))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const tabItems = [
    {
      id: 'overview' as AdminTab,
      label: language === 'vi' ? 'Tổng quan' : 'Overview',
      icon: BarChart3
    },
    {
      id: 'users' as AdminTab,
      label: language === 'vi' ? 'Quản lý User' : 'Manage Users',
      icon: Users
    },
    {
      id: 'packages' as AdminTab,
      label: language === 'vi' ? 'Quản lý gói cước' : 'Package Management',
      icon: CreditCard
    },
    {
      id: 'notifications' as AdminTab,
      label: language === 'vi' ? 'Gửi thông báo' : 'Notification Management',
      icon: Bell
    },
    {
      id: 'analytics' as AdminTab,
      label: language === 'vi' ? 'Thống kê' : 'Analytics',
      icon: TrendingUp
    },
    {
      id: 'activity-logs' as AdminTab,
      label: language === 'vi' ? 'Nhật ký hoạt động' : 'Activity Logs',
      icon: ClipboardList
    },
    {
      id: 'reports' as AdminTab,
      label: language === 'vi' ? 'Báo cáo vi phạm' : 'Reports',
      icon: AlertTriangle
    },
    {
      id: 'ai-moderation' as AdminTab,
      label: language === 'vi' ? 'Kiểm duyệt AI' : 'AI Moderation',
      icon: Cpu
    }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="size-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Đang tải dữ liệu admin...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="size-12 text-rose-500 mb-4" />
        <p className="text-slate-800 dark:text-slate-200 font-bold mb-2">Không thể tải dữ liệu admin.</p>
        <p className="text-slate-500 text-sm mb-6 max-w-md text-center">{error}</p>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          <RefreshCw className="size-4" />
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      {/* Header section with live status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400">
              <Shield className="size-7" />
            </span>
            {t.admin?.title || 'Admin Dashboard'}
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mt-2 text-sm max-w-2xl font-medium">
            {t.admin?.subtitle || 'Quản lý toàn bộ hệ thống'}
          </p>
        </div>

        {/* Pulse live status badge */}
        <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/25 dark:border-emerald-500/15 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 self-start md:self-center select-none shadow-sm shadow-emerald-500/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{t.admin?.activeAdminGlow || 'Hệ thống đang hoạt động'}</span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 w-full scroll-smooth overflow-x-auto no-scrollbar gap-2">
        {tabItems.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id || (tab.id === 'ai-moderation' && activeTab === 'documents')
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="size-4 stroke-[2.25]" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content renderer */}
      <div className="mt-4 transition-all duration-300 animate-fade-in">
        {activeTab === 'overview' && (
          <AdminOverviewTab stats={stats} users={users} documents={documents} />
        )}
        
        {activeTab === 'users' && (
          <AdminUsersTab
            users={users}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'packages' && (
          <AdminPackagesTab
            users={users}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {activeTab === 'notifications' && (
          <AdminNotificationsTab />
        )}

        {activeTab === 'analytics' && (
          <AdminAnalyticsTab />
        )}

        {activeTab === 'activity-logs' && (
          <AdminLogsTab />
        )}

        {activeTab === 'reports' && (
          <AdminReportsTab />
        )}

        {(activeTab === 'documents' || activeTab === 'ai-moderation') && (
          <AdminDocumentsTab
            documents={documents}
            onUpdateDocument={handleUpdateDocument}
            onDeleteDocument={handleDeleteDocument}
            onApproveDocument={handleApproveDocument}
            onRejectDocument={handleRejectDocument}
          />
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage

