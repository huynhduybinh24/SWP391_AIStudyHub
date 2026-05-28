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
      return JSON.parse(data);
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

