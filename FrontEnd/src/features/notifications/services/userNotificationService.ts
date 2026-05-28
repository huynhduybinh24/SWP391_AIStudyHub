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

const getNotificationStorageKey = (email: string) => {
  return `aiStudyHubUserNotifications:${email}`;
};

export const userNotificationService = {
  getUserNotifications(email?: string): UserNotification[] {
    try {
      const targetEmail = email || getCurrentUser().email;
      const key = getNotificationStorageKey(targetEmail);
      const data = localStorage.getItem(key);
      if (!data) return [];
      const list: UserNotification[] = JSON.parse(data);

      // Filter out notifications older than 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const validList = list.filter((n: any) => {
        const timestamp = n.createdAt ? new Date(n.createdAt).getTime() : Date.now();
        return timestamp >= sevenDaysAgo;
      });

      if (validList.length !== list.length) {
        localStorage.setItem(key, JSON.stringify(validList));
      }

      return validList;
    } catch (error) {
      console.error('Failed to parse user notifications from localStorage', error);
      return [];
    }
  },

  saveUserNotifications(notifications: UserNotification[], email?: string): void {
    try {
      const targetEmail = email || getCurrentUser().email;
      const key = getNotificationStorageKey(targetEmail);
      localStorage.setItem(key, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save user notifications to localStorage', error);
    }
  },

  addUserNotification(notification: Omit<UserNotification, "id" | "createdAt" | "isRead" | "time"> & { targetUserEmail?: string }): UserNotification {
    const targetEmail = notification.targetUserEmail || getCurrentUser().email;
    const notifications = this.getUserNotifications(targetEmail);
    
    // Deduplicate: remove older duplicate notifications (type, documentId, reason) to avoid spam
    const filteredNotifications = notifications.filter(n => {
      const isDuplicate = n.type === notification.type &&
                          n.documentId === notification.documentId &&
                          n.reason === notification.reason;
      return !isDuplicate;
    });

    const newNotification: UserNotification = {
      ...notification,
      id: `usr-ntf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      time: "Just now",
      isRead: false
    };

    const updatedNotifications = [newNotification, ...filteredNotifications];
    this.saveUserNotifications(updatedNotifications, targetEmail);
    window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));

    // Trigger toast if the active user is the one receiving it
    if (typeof window !== 'undefined') {
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
    }

    return newNotification;
  },

  markUserNotificationAsRead(id: string, email?: string): void {
    const targetEmail = email || getCurrentUser().email;
    const notifications = this.getUserNotifications(targetEmail);
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    this.saveUserNotifications(updatedNotifications, targetEmail);
    window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
  },

  markAllUserNotificationsAsRead(email?: string): void {
    const targetEmail = email || getCurrentUser().email;
    const notifications = this.getUserNotifications(targetEmail);
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    this.saveUserNotifications(updatedNotifications, targetEmail);
    window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
  }
};

