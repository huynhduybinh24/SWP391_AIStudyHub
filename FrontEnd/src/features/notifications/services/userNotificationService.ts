import { apiClient } from '@/lib/axios';

export const getCurrentUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const data = localStorage.getItem('aiStudyHubCurrentUser');
  if (!data) {
    return null;
  }
  try {
    const user = JSON.parse(data);
    if (!user || !user.email) return null;
    return {
      id: user.id || user.email,
      email: user.email,
      role: (user.role || 'user').toLowerCase(),
      name: user.name || user.email.split('@')[0],
    };
  } catch (e) {
    return null;
  }
};



export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  time?: string;
  isRead: boolean;
  targetUserEmail?: string;
  documentId?: string;
  documentName?: string;
  reason?: string;
  actionType?: string;
}

export const userNotificationService = {
  async getNotifications(currentUser?: any): Promise<UserNotification[]> {
    const email = currentUser?.email || '';
    const response = await apiClient.get(`/notifications?email=${encodeURIComponent(email)}`);
    const list = response.data?.data || response.data;
    if (Array.isArray(list)) {
      return list;
    }
    return [];
  },

  async deleteNotification(id: string, _email?: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },

  async restoreNotification(id: string): Promise<void> {
    await apiClient.put(`/notifications/${id}/restore`);
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.put(`/notifications/${id}/read`);
  },

  async markUserNotificationAsRead(id: string, email?: string): Promise<void> {
    return this.markAsRead(id);
  },

  async markAllAsRead(email?: string): Promise<void> {
    await apiClient.put(`/notifications/read-all?email=${encodeURIComponent(email || '')}`);
  },

  async markAllUserNotificationsAsRead(email?: string): Promise<void> {
    return this.markAllAsRead(email);
  },

  async addUserNotification(notification: any): Promise<any> {
    const response = await apiClient.post('/notifications', notification);
    return response.data?.data || response.data;
  },

  async addNotification(payload: any): Promise<any> {
    return this.addUserNotification(payload);
  }
};
