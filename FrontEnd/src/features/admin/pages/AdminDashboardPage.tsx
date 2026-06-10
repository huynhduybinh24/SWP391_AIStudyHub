import { useState, useEffect, useRef } from 'react'
import { Shield, Users, BarChart3, Loader2, AlertCircle, RefreshCw, CreditCard, Bell, TrendingUp, ClipboardList, AlertTriangle, ChevronDown, Wrench, CheckCircle, FileText, ChevronLeft, ChevronRight, Handshake, MessageSquare } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { AdminOverviewTab } from '@/features/admin/components/AdminOverviewTab'
import { AdminDocumentsTab } from '@/features/admin/components/AdminDocumentsTab'
import { AdminUsersTab } from '@/features/admin/components/AdminUsersTab'
import { AdminPackagesTab } from '@/features/admin/components/AdminPackagesTab'
import { AdminNotificationsTab } from '@/features/admin/components/AdminNotificationsTab'
import { AdminAnalyticsTab } from '@/features/admin/components/AdminAnalyticsTab'
import { AdminLogsTab } from '@/features/admin/components/AdminLogsTab'
import { AdminReportsTab } from '@/features/admin/components/AdminReportsTab'
import { AdminSupportTab } from '@/features/admin/components/AdminSupportTab'
import { adminService, AdminStats, AdminUser, AdminDocument } from '../services/adminService'
import { getSystemStatusSync, updateSystemStatus, SystemStatus, SystemStatusState } from '@/features/admin/services/systemStatusService'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
type AdminTab = 'overview' | 'users' | 'packages' | 'notifications' | 'documents' | 'analytics' | 'activity-logs' | 'reports' | 'ai-moderation' | 'support'

export function AdminDashboardPage() {
  const { t, language } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as AdminTab) || 'overview'
  
  const toast = useToast()
  const [systemStatus, setSystemStatus] = useState<SystemStatusState>(getSystemStatusSync())
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false)

  const tabsRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const handleScroll = () => {
    if (!tabsRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current
    setShowLeftArrow(scrollLeft > 0)
    // Add small tolerance (e.g. 2px) for zoom or rounding issues
    setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2)
  }

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsRef.current) return
    const scrollAmount = 300
    tabsRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = tabsRef.current
    if (!el) return
    const handleNativeWheel = (e: WheelEvent) => {
      // If we are scrolling vertically and not horizontally
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleNativeWheel)
  }, [])

  useEffect(() => {
    if (tabsRef.current) {
      const activeElement = tabsRef.current.querySelector('[data-active="true"]')
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
    setTimeout(handleScroll, 150)
  }, [activeTab])
  
  useEffect(() => {
    setTimeout(handleScroll, 100)
    window.addEventListener('resize', handleScroll)
    return () => window.removeEventListener('resize', handleScroll)
  }, [])

  useEffect(() => {
    const handleStatusUpdate = () => {
      setSystemStatus(getSystemStatusSync())
    }
    window.addEventListener('aiStudyHubSystemStatusUpdated', handleStatusUpdate)
    return () => window.removeEventListener('aiStudyHubSystemStatusUpdated', handleStatusUpdate)
  }, [])

  const handleStatusChange = async (status: SystemStatus) => {
    if (status === 'maintenance') {
      setMaintenanceConfirmOpen(true)
      setStatusMenuOpen(false)
      return
    }
    await updateSystemStatus(status)
    toast.success('System status updated.')
    setStatusMenuOpen(false)
  }

  const confirmMaintenance = async () => {
    await updateSystemStatus('maintenance')
    toast.success('System status updated.')
    setMaintenanceConfirmOpen(false)
  }

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

  const handleUpdateUser = async (userId: string, updates: Partial<AdminUser>, reason?: string) => {
    try {
      const updated = await adminService.updateUser(userId, updates, reason)
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
      
      // Sync updated user data to useAuthStore if the updated account is the active session
      const currentUser = useAuthStore.getState().user
      if (currentUser && currentUser.email?.toLowerCase() === updated.email?.toLowerCase()) {
        useAuthStore.setState({
          user: {
            ...currentUser,
            plan: updated.plan as any,
            role: updated.role as any,
            name: updated.name,
          }
        })
        
        // Also persist to 'aiStudyHubCurrentUser' in localStorage so it doesn't get reverted on page reload
        localStorage.setItem('aiStudyHubCurrentUser', JSON.stringify({
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          plan: updated.plan || 'free',
          avatar: (updated as any).avatar || '/logo.png'
        }))
      }

      // Sync updated plan to quick switcher accounts registry if present
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
          if (stored) {
            const list = JSON.parse(stored)
            if (Array.isArray(list)) {
              const updatedList = list.map((acc: any) => {
                if (acc.email?.toLowerCase() === updated.email?.toLowerCase()) {
                  return {
                    ...acc,
                    name: updated.name,
                    role: updated.role === 'admin' ? 'admin' : updated.role === 'teacher' ? 'instructor' : 'student',
                    plan: (updated.plan || 'free').toUpperCase()
                  }
                }
                return acc
              })
              localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(updatedList))
            }
          }
        } catch (e) {
          console.error('Failed to sync updated user to quick switcher accounts list:', e)
        }
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteUser = async (userId: string, reason?: string) => {
    try {
      await adminService.deleteUser(userId, reason)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateDocument = async (documentId: string, updates: Partial<AdminDocument>, reason?: string) => {
    try {
      const updated = await adminService.updateDocument(documentId, updates, reason)
      setDocuments((prev) => prev.map((d) => (d.id === documentId ? updated : d)))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteDocument = async (documentId: string, reason?: string) => {
    try {
      await adminService.deleteDocument(documentId, reason)
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

  const handleRejectDocument = async (documentId: string, reason?: string) => {
    try {
      const updated = await adminService.rejectDocument(documentId, reason)
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
      id: 'ai-moderation' as AdminTab,
      label: language === 'vi' ? 'Quản lý tài liệu' : 'Document Management',
      icon: FileText
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
      id: 'support' as AdminTab,
      label: language === 'vi' ? 'Quản lý hỗ trợ' : 'Support Tickets',
      icon: MessageSquare
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

        {/* Pulse live status badge -> Dropdown Control */}
        <div className="relative self-start md:self-center select-none">
          <button 
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            className={`flex items-center gap-2 border px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer ${
              systemStatus.status === 'active' 
                ? 'bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                : systemStatus.status === 'maintenance'
                ? 'bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/25 text-amber-600 dark:text-amber-400'
                : 'bg-rose-500/10 dark:bg-rose-500/5 border-rose-500/25 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                systemStatus.status === 'active' ? 'bg-emerald-400' 
                : systemStatus.status === 'maintenance' ? 'bg-amber-400' 
                : 'bg-rose-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                systemStatus.status === 'active' ? 'bg-emerald-500' 
                : systemStatus.status === 'maintenance' ? 'bg-amber-500' 
                : 'bg-rose-500'
              }`}></span>
            </span>
            <span>
              {systemStatus.status === 'active' ? (language === 'vi' ? 'Hệ thống hoạt động' : 'System Active')
                : systemStatus.status === 'maintenance' ? (language === 'vi' ? 'Đang bảo trì' : 'Maintenance Mode')
                : (language === 'vi' ? 'Hệ thống gặp sự cố' : 'System Incident')}
            </span>
            <ChevronDown className="size-3 ml-1" />
          </button>

          {statusMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 py-1 shadow-xl z-50">
              <button
                onClick={() => handleStatusChange('active')}
                className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-emerald-600"
              >
                <CheckCircle className="size-4" /> {language === 'vi' ? 'Hệ thống hoạt động' : 'System Active'}
              </button>
              <button
                onClick={() => handleStatusChange('maintenance')}
                className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-amber-600"
              >
                <Wrench className="size-4" /> {language === 'vi' ? 'Đang bảo trì' : 'Maintenance Mode'}
              </button>
              <button
                onClick={() => handleStatusChange('incident')}
                className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-rose-600"
              >
                <AlertTriangle className="size-4" /> {language === 'vi' ? 'Hệ thống gặp sự cố' : 'System Incident'}
              </button>
            </div>
          )}

          <Modal
            isOpen={maintenanceConfirmOpen}
            onClose={() => setMaintenanceConfirmOpen(false)}
            title={language === 'vi' ? 'Bật chế độ bảo trì?' : 'Enable Maintenance Mode?'}
          >
            <div className="p-1">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium leading-relaxed">
                {language === 'vi' ? 'Người dùng thường sẽ không thể truy cập hệ thống cho đến khi chế độ bảo trì được tắt.' : 'Regular users will not be able to access the system until maintenance mode is disabled.'}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMaintenanceConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={confirmMaintenance}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Wrench className="size-4" />
                  {language === 'vi' ? 'Bật bảo trì' : 'Enable Maintenance'}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>

      <div className="relative w-full border-b border-slate-200 dark:border-slate-800">
        {/* Left arrow with fade */}
        <div className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 z-10 flex items-center transition-opacity duration-300 ${showLeftArrow ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <button 
            onClick={() => scrollTabs('left')}
            className="ml-1 p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>

        <div 
          ref={tabsRef}
          onScroll={handleScroll}
          className="flex w-full scroll-smooth overflow-x-auto overflow-y-hidden whitespace-nowrap gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative"
        >
          {tabItems.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id || (tab.id === 'ai-moderation' && activeTab === 'documents')
            return (
              <button
                key={tab.id}
                data-active={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
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

        {/* Right arrow with fade */}
        <div className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 z-10 flex items-center justify-end transition-opacity duration-300 ${showRightArrow ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <button 
            onClick={() => scrollTabs('right')}
            className="mr-1 p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
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

        {activeTab === 'support' && (
          <AdminSupportTab />
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage

