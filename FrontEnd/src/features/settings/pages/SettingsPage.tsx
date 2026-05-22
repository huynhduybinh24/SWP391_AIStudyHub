import { AccountSettingsCard } from '../components/AccountSettingsCard'
import { SecurityCard } from '../components/SecurityCard'
import { InterfaceCard } from '../components/InterfaceCard'
import { NotificationCard } from '../components/NotificationCard'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Settings</h1>
        <p className="mt-1.5 text-sm text-muted dark:text-slate-400">
          Manage your account preferences and workspace configurations.
        </p>
      </div>

      {/* Grid Layout: 2 Columns (Left large, Right small) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (takes 2 of 3 columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <AccountSettingsCard />
          <InterfaceCard />
        </div>

        {/* Right Column (takes 1 of 3 columns on large screens) */}
        <div className="lg:col-span-1 space-y-6">
          <SecurityCard />
          <NotificationCard />
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
