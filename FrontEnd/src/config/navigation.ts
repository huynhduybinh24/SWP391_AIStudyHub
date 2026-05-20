import {
  Bell,
  Bot,
  Cloud,
  FileText,
  LayoutDashboard,
  Share2,
  Settings,
  Upload,
  User,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Documents', path: '/dashboard/documents', icon: FileText },
  { label: 'Upload', path: '/dashboard/upload', icon: Upload },
  { label: 'AI Chatbot', path: '/dashboard/chat', icon: Bot },
  { label: 'Shared Files', path: '/dashboard/shared', icon: Share2 },
  { label: 'Cloud Storage', path: '/dashboard/storage', icon: Cloud },
  { label: 'Notifications', path: '/dashboard/notifications', icon: Bell },
  { label: 'Study Plans', path: '/dashboard/study-plans', icon: CalendarDays },
]

export const bottomNavItems: NavItem[] = [
  { label: 'Profile', path: '/dashboard/profile', icon: User },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings },
]
