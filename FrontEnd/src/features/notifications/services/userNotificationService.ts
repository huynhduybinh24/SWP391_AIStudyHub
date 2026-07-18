import { apiClient } from '@/lib/axios';

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
