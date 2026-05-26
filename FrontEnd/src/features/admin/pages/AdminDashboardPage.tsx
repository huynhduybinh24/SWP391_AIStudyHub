import { Shield, Users, FileText, BarChart3, Bell, CreditCard } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useSearchParams } from 'react-router-dom'
import { AdminOverviewTab } from '@/features/admin/components/AdminOverviewTab'
import { AdminDocumentsTab } from '@/features/admin/components/AdminDocumentsTab'
import { AdminUsersTab } from '@/features/admin/components/AdminUsersTab'
import { AdminPackagesTab } from '@/features/admin/components/AdminPackagesTab'
import { AdminNotificationsTab } from '@/features/admin/components/AdminNotificationsTab'

type AdminTab = 'overview' | 'users' | 'packages' | 'notifications' | 'moderation'

export function AdminDashboardPage() {
  const { t, language } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as AdminTab) || 'overview'

  const setActiveTab = (tab: AdminTab) => {
    setSearchParams({ tab })
  }

  const tabItems = [
    {
      id: 'overview' as AdminTab,
      label: t.admin.tabOverview,
      icon: BarChart3
    },
    {
      id: 'users' as AdminTab,
      label: t.admin.tabUsers,
      icon: Users
    },
    {
      id: 'packages' as AdminTab,
      label: language === 'vi' ? 'Quản lý gói cước' : 'Package Management',
      icon: CreditCard
    },
    {
      id: 'notifications' as AdminTab,
      label: language === 'vi' ? 'Gửi thông báo' : 'Broadcast Center',
      icon: Bell
    },
    {
      id: 'moderation' as AdminTab,
      label: t.admin.tabDocs,
      icon: FileText
    }
  ]

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      {/* Header section with live status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Shield className="size-7" />
            </span>
            {t.admin.title}
          </h1>
          <p className="text-slate-550 dark:text-slate-400 mt-2 text-sm max-w-2xl font-medium">
            {t.admin.subtitle}
          </p>
        </div>

        {/* Pulse live status badge */}
        <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/25 dark:border-emerald-500/15 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 self-start md:self-center select-none shadow-sm shadow-emerald-500/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{t.admin.activeAdminGlow}</span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 w-full scroll-smooth overflow-x-auto no-scrollbar gap-2">
        {tabItems.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
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
        {activeTab === 'overview' && <AdminOverviewTab />}
        
        {activeTab === 'users' && <AdminUsersTab />}

        {activeTab === 'packages' && <AdminPackagesTab />}

        {activeTab === 'notifications' && <AdminNotificationsTab />}

        {activeTab === 'moderation' && <AdminDocumentsTab />}
      </div>
    </div>
  )
}

export default AdminDashboardPage
