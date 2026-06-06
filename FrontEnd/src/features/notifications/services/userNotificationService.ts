import { apiClient } from '@/lib/axios';

export type UserNotificationType =
  | "document_deleted"
  | "document_rejected"
  | "document_approved"
  | "system"
  | "shared_file"
  | "ai_update";

export interface UserNotification {
  id: string;
  type: UserNotificationType;
  title: string;
  message: string;
  documentId?: string;
  documentName?: string;
  reason?: string;
  actionType?: "removed" | "rejected" | "approved" | "system";
  adminNote?: string;
  createdAt: string;
  time?: string;
  isRead: boolean;
  targetUserEmail?: string;
}

export const getCurrentUser = () => {
  if (typeof window === 'undefined') {
    return { id: 'admin', email: 'admin@example.com', role: 'admin', name: 'Alex Morgan' };
  }
  const data = localStorage.getItem('aiStudyHubCurrentUser');
  if (!data) {
    return { id: 'admin', email: 'admin@example.com', role: 'admin', name: 'Alex Morgan' };
  }
  try {
    const user = JSON.parse(data);
    return {
      id: user.id || user.email || 'admin',
      email: user.email || 'admin@example.com',
      role: (user.role || 'admin').toLowerCase(),
      name: user.name || 'Alex Morgan',
    };
  } catch (e) {
    return { id: 'admin', email: 'admin@example.com', role: 'admin', name: 'Alex Morgan' };
  }
};

export const userNotificationService = {
  getUserNotifications(_email?: string): UserNotification[] {
    return [];
  },

  saveUserNotifications(_notifications: UserNotification[], _email?: string): void {
    // No-op
  },

  async addUserNotification(notification: Omit<UserNotification, "id" | "createdAt" | "isRead" | "time"> & { targetUserEmail?: string }): Promise<any> {
    const targetEmail = notification.targetUserEmail || getCurrentUser().email;
    try {
      const payload = {
        ...notification,
        targetUserEmail: targetEmail
      };
      
      const response = await apiClient.post('/notifications', payload);
      window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));

      if (typeof window !== 'undefined') {
        import('@/stores/authStore').then((auth) => {
          const { isAuthenticated } = auth.useAuthStore.getState();
          if (!isAuthenticated) return;

          const activeUserStr = localStorage.getItem('aiStudyHubCurrentUser');
          if (activeUserStr) {
            try {
              const activeUser = JSON.parse(activeUserStr);
              if (activeUser?.email?.toLowerCase() === targetEmail.toLowerCase()) {
                import('@/stores/toastStore').then((m) => {
                  let toastType: 'success' | 'info' | 'warning' | 'error' = 'info';
                  if (notification.type === 'document_deleted' || notification.type === 'document_rejected') {
                    toastType = 'warning';
                  } else if (notification.type === 'document_approved') {
                    toastType = 'success';
                  }
                  const messageSummary = notification.message.length > 60 
                    ? notification.message.substring(0, 60) + '...'
                    : notification.message;
                  m.useToastStore.getState().addToast(
                    `${notification.title}: ${messageSummary}`,
                    toastType,
                    4000
                  );
                });
              }
            } catch (e) {}
          }
        });
      }

      if (response.data && response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to add user notification via backend', error);
    }
    return null;
  },

  async markUserNotificationAsRead(id: string, _email?: string): Promise<void> {
    try {
      await apiClient.put(`/notifications/${id}/read`);
    } catch (e) {
      console.error('Failed to mark user notification as read via backend', e);
    }
    window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
  },

  async markAllUserNotificationsAsRead(email?: string): Promise<void> {
    const targetEmail = email || getCurrentUser().email;
    try {
      await apiClient.put(`/notifications/read-all?email=${encodeURIComponent(targetEmail)}`);
    } catch (e) {
      console.error('Failed to mark all user notifications as read via backend', e);
    }
    window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
  }
};

