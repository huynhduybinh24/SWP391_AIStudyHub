import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RoleRoute } from '@/app/router/RoleRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage'
import { UploadPage } from '@/features/documents/pages/UploadPage'
import { ChatPage } from '@/features/ai-chatbot/pages/ChatPage'
import { QuizzesPage } from '@/features/quizzes/pages/QuizzesPage'
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { DEV_SKIP_AUTH } from '@/config/dev'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Navigate to="/" replace />,
  },
  {
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'upload', element: <UploadPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'shared', element: <PlaceholderPage title="Shared Files" /> },
      { path: 'storage', element: <PlaceholderPage title="Cloud Storage" /> },
      { path: 'notifications', element: <PlaceholderPage title="Notifications" /> },
      { path: 'study-plans', element: <PlaceholderPage title="Study Plans" /> },
      { path: 'profile', element: <PlaceholderPage title="Profile" /> },
      { path: 'settings', element: <PlaceholderPage title="Settings" /> },
      { path: 'quizzes', element: <QuizzesPage /> },
      ...(DEV_SKIP_AUTH
        ? [{ path: 'admin', element: <AdminDashboardPage /> }]
        : [
            {
              element: <RoleRoute allowedRoles={['admin']} />,
              children: [{ path: 'admin', element: <AdminDashboardPage /> }],
            },
          ]),
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
