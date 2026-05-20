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
  { label: 'My Documents', path: '/documents', icon: FileText },
  { label: 'Upload', path: '/upload', icon: Upload },
  { label: 'AI Chatbot', path: '/chat', icon: Bot },
  { label: 'Shared Files', path: '/shared', icon: Share2 },
  { label: 'Cloud Storage', path: '/storage', icon: Cloud },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Study Plans', path: '/study-plans', icon: CalendarDays },
]

export const bottomNavItems: NavItem[] = [
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings },
]
