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
}

const STORAGE_KEY = 'aiStudyHubUserNotifications';

export const userNotificationService = {
  getUserNotifications(): UserNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse user notifications from localStorage', error);
      return [];
    }
  },

  saveUserNotifications(notifications: UserNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save user notifications to localStorage', error);
    }
  },

  addUserNotification(notification: Omit<UserNotification, "id" | "createdAt" | "isRead" | "time">): UserNotification {
    const notifications = this.getUserNotifications();
    const newNotification: UserNotification = {
      ...notification,
      id: `usr-ntf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      time: "Just now",
      isRead: false
    };

    const updatedNotifications = [newNotification, ...notifications];
    this.saveUserNotifications(updatedNotifications);
    window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
    return newNotification;
  },

  markUserNotificationAsRead(id: string): void {
    const notifications = this.getUserNotifications();
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    this.saveUserNotifications(updatedNotifications);
    window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
  },

  markAllUserNotificationsAsRead(): void {
    const notifications = this.getUserNotifications();
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    this.saveUserNotifications(updatedNotifications);
    window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
  }
};
