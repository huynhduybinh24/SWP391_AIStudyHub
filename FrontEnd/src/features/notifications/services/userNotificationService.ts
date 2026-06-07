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
  getUserNotifications(email?: string): UserNotification[] {
    const targetEmail = email || getCurrentUser().email;
    try {
      const stored = localStorage.getItem(`aiStudyHubUserNotifications:${targetEmail}`);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      
      const storedDeleted = localStorage.getItem(`aiStudyHubDeletedNotificationIds:${targetEmail}`);
      let deletedIds: string[] = [];
      if (storedDeleted) {
        try {
          deletedIds = JSON.parse(storedDeleted);
        } catch (e) {
          deletedIds = [];
        }
      }
      
      return Array.isArray(parsed) ? parsed.filter((n: any) => n && n.id && !deletedIds.includes(n.id)) : [];
    } catch (e) {
      console.error('Failed to parse notifications from localStorage', e);
      return [];
    }
  },

  saveUserNotifications(notifications: UserNotification[], email?: string): void {
    const targetEmail = email || getCurrentUser().email;
    try {
      localStorage.setItem(`aiStudyHubUserNotifications:${targetEmail}`, JSON.stringify(notifications));
      window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
    } catch (e) {
      console.error('Failed to save notifications to localStorage', e);
    }
  },

  getNotifications(currentUser?: any): UserNotification[] {
    const email = currentUser?.email || getCurrentUser().email;
    return this.getUserNotifications(email);
  },

  async addNotification(payload: Omit<UserNotification, "id" | "createdAt" | "isRead" | "time"> & { targetUserEmail?: string }): Promise<any> {
    return this.addUserNotification(payload);
  },

  deleteNotification(id: string, email?: string): void {
    const targetEmail = email || getCurrentUser().email;
    try {
      const storedDeleted = localStorage.getItem(`aiStudyHubDeletedNotificationIds:${targetEmail}`);
      let deletedIds: string[] = [];
      if (storedDeleted) {
        try {
          deletedIds = JSON.parse(storedDeleted);
        } catch (e) {
          deletedIds = [];
        }
      }
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem(`aiStudyHubDeletedNotificationIds:${targetEmail}`, JSON.stringify(deletedIds));
      }
      window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  },

  async markAsRead(id: string, email?: string): Promise<void> {
    return this.markUserNotificationAsRead(id, email);
  },

  async markAllAsRead(email?: string): Promise<void> {
    return this.markAllUserNotificationsAsRead(email);
  },

  getUnreadCount(email?: string): number {
    const targetEmail = email || getCurrentUser().email;
    const list = this.getUserNotifications(targetEmail);
    return list.filter(n => !n.isRead).length;
  },

  async addUserNotification(notification: Omit<UserNotification, "id" | "createdAt" | "isRead" | "time"> & { targetUserEmail?: string }): Promise<any> {
    const targetEmail = notification.targetUserEmail || getCurrentUser().email;
    
    const newNotif: UserNotification = {
      ...notification,
      id: `usr-ntf-${Date.now()}`,
      createdAt: new Date().toISOString(),
      time: 'Just now',
      isRead: false,
      targetUserEmail: targetEmail
    };
    
    try {
      const list = this.getUserNotifications(targetEmail);
      list.unshift(newNotif);
      this.saveUserNotifications(list, targetEmail);
    } catch (e) {
      console.error('Failed to save new notification locally', e);
    }

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
    return newNotif;
  },

  async markUserNotificationAsRead(id: string, email?: string): Promise<void> {
    const targetEmail = email || getCurrentUser().email;
    try {
      const list = this.getUserNotifications(targetEmail);
      const updated = list.map(n => n.id === id ? { ...n, isRead: true } : n);
      this.saveUserNotifications(updated, targetEmail);
    } catch (e) {
      console.error('Failed to mark notification as read locally', e);
    }

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
      const list = this.getUserNotifications(targetEmail);
      const updated = list.map(n => ({ ...n, isRead: true }));
      this.saveUserNotifications(updated, targetEmail);
    } catch (e) {
      console.error('Failed to mark all notifications as read locally', e);
    }

    try {
      await apiClient.put(`/notifications/read-all?email=${encodeURIComponent(targetEmail)}`);
    } catch (e) {
      console.error('Failed to mark all user notifications as read via backend', e);
    }
    window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
  }
};

