import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RoleRoute } from '@/app/router/RoleRoute'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage'
import MyDocumentsPage from '@/features/documents/pages/MyDocumentsPage'
import SubjectCategoryPage from '@/features/documents/pages/SubjectCategoryPage'
import { UploadSubjectDocumentPage } from '@/features/documents/pages/UploadSubjectDocumentPage'
import { SearchResultsPage } from '@/features/documents/pages/SearchResultsPage'
import DocumentDetailPage from '@/features/documents/pages/DocumentDetailPage'
import { UploadPage } from '@/features/documents/pages/UploadPage'
import { ChatPage } from '@/features/ai-chatbot/pages/ChatPage'
import { QuizzesPage } from '@/features/quizzes/pages/QuizzesPage'
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage'
import { StudyPlansPage } from '@/features/study-plans/pages/StudyPlansPage'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { CloudStoragePage } from '@/features/storage/pages/CloudStoragePage'
import { StorageExplorerPage } from '@/features/storage/pages/StorageExplorerPage'
import { FilePreviewPage } from '@/features/storage/pages/FilePreviewPage'
import { StorageCleanupPage } from '@/features/storage/pages/StorageCleanupPage'
import { StorageAnalyticsPage } from '@/features/storage/pages/StorageAnalyticsPage'
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'
import { SummaryDetailPage } from '@/features/notifications/pages/SummaryDetailPage'
import { SharedFolderPage } from '@/features/shared-files/pages/SharedFolderPage'
import { DEV_SKIP_AUTH } from '@/config/dev'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { LandingPage } from '@/features/landing/pages/LandingPage'
import { HelpCenterPage } from '@/features/landing/pages/HelpCenterPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { SetNewPasswordPage } from '@/features/auth/pages/SetNewPasswordPage'
import { ProfileDashboard } from '@/features/profile/pages/Dashboard'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { PricingPage } from '@/features/upgrade/pages/PricingPage'
import { CheckoutPage } from '@/features/upgrade/pages/CheckoutPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/help',
    element: <HelpCenterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/set-new-password',
    element: <SetNewPasswordPage />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: 'documents',
            element: <DocumentsPage />,
            children: [
              { index: true, element: <MyDocumentsPage /> },
              { path: 'subject/:subjectId', element: <SubjectCategoryPage /> },
              { path: 'subject/:subjectId/upload', element: <UploadSubjectDocumentPage /> },
              { path: 'search', element: <SearchResultsPage /> },
              { path: 'document/:documentId', element: <DocumentDetailPage /> }
            ]
          },
          { path: 'upload', element: <UploadPage /> },
          { path: 'chat', element: <ChatPage /> },
          { path: 'shared', element: <PlaceholderPage title="Shared Files" /> },
          { path: 'shared-files/research-materials', element: <SharedFolderPage /> },
          { path: 'storage', element: <CloudStoragePage /> },
          { path: 'storage/explorer', element: <StorageExplorerPage /> },
          { path: 'storage/explorer/preview', element: <FilePreviewPage /> },
          { path: 'storage/cleanup', element: <StorageCleanupPage /> },
          { path: 'storage/analytics', element: <StorageAnalyticsPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'notifications/summary', element: <SummaryDetailPage /> },
          { path: 'study-plans', element: <StudyPlansPage /> },
          { path: 'profile', element: <ProfileDashboard /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'upgrade', element: <PricingPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
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
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
