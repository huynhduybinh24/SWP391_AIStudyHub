import React from 'react';
import { Folder, Calendar, ExternalLink, Eye } from 'lucide-react';
import { getCurrentUser, userNotificationService } from '../services/userNotificationService';
import { apiClient } from '@/lib/axios';
import { useToastStore } from '@/stores/toastStore';

export type NotificationType =
  | 'ai'
  | 'folder'
  | 'mention'
  | 'security'
  | 'document'
  | 'calendar'
  | 'flashcard'
  | 'document_deleted'
  | 'document_rejected'
  | 'document_removed'
  | 'document_approved'
  | 'system'
  | 'shared_file'
  | 'ai_update';

export interface NotificationButton {
  text: string;
  variant: 'primary' | 'secondary' | 'light' | 'shared-btn';
  icon?: React.ReactNode;
  url?: string;
  onClick?: () => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  time: string;
  isRead: boolean;
  description: React.ReactNode;
  quote?: string;
  actionText?: string;
  actionUrl?: string;
  avatar?: string;
  buttons?: NotificationButton[];
  reason?: string;
  documentName?: string;
  documentId?: string;
  actionType?: "removed" | "rejected" | "approved" | "system";
  adminNote?: string;
  targetUserEmail?: string;
}



const mapBackendNotification = (item: any): Notification => {
  const type = item.type as NotificationType;
  let displayType = type;
  let buttons: NotificationButton[] | undefined = undefined;

  if (item.actionType === 'workspace_invite' || type === 'shared_file') {
    const actionUrl = item.actionUrl || '';
    const match = actionUrl.match(/\/dashboard\/workspaces\/(\d+)/);
    const workspaceId = match ? match[1] : null;
    const currentUser = getCurrentUser();

    buttons = [
      {
        text: 'Chấp nhận',
        variant: 'primary',
        onClick: async () => {
          if (!workspaceId) return;
          try {
            await apiClient.post(`/workspaces/${workspaceId}/respond?userId=${currentUser.id}&action=ACCEPT`);
            useToastStore.getState().addToast('Đã chấp nhận lời mời tham gia nhóm học tập!', 'success', 3000);
            window.dispatchEvent(new Event('aiStudyHubUserChanged'));
            window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
          } catch (error) {
            console.error('Failed to accept workspace invite:', error);
            useToastStore.getState().addToast('Không thể chấp nhận lời mời', 'error', 3000);
          }
        }
      },
      {
        text: 'Từ chối',
        variant: 'light',
        onClick: async () => {
          if (!workspaceId) return;
          try {
            await apiClient.post(`/workspaces/${workspaceId}/respond?userId=${currentUser.id}&action=REJECT`);
            useToastStore.getState().addToast('Đã từ chối lời mời tham gia nhóm học tập!', 'info', 3000);
            window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
          } catch (error) {
            console.error('Failed to decline workspace invite:', error);
            useToastStore.getState().addToast('Không thể từ chối lời mời', 'error', 3000);
          }
        }
      }
    ];
    displayType = 'folder';
  } else if (type === 'folder') {
    buttons = [{
      text: 'Open Folder',
      variant: 'shared-btn',
      icon: <Folder className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
      url: actionUrl || '/dashboard/shared-files/research-materials'
    }];
  } else if (type === 'document') {
    buttons = [{
      text: 'View Document',
      variant: 'shared-btn',
      icon: <Eye className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
      url: actionUrl || '/dashboard/notifications/summary'
    }];
  } else if (type === 'calendar') {
    buttons = [{
      text: 'Open Plan',
      variant: 'secondary',
      icon: <Calendar className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
      url: actionUrl || '/dashboard/study-plans'
    }];
  } else if (type === 'flashcard') {
    buttons = [{
      text: 'Practice Now',
      variant: 'secondary',
      icon: <ExternalLink className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
      url: actionUrl || '/dashboard/quizzes'
    }];
  } else if (type === 'security') {
    buttons = [
      { text: 'Review Activity', variant: 'primary', url: actionUrl || '#' },
      { text: 'It was me', variant: 'light', url: '#' }
    ];
  }

  return {
    id: String(item.id),
    type: displayType,
    title: item.title,
    time: item.time || 'Just now',
    isRead: item.isRead !== undefined ? !!item.isRead : !!item.read,
    description: item.description || item.message,
    quote: item.quote,
    actionText: item.actionText,
    actionUrl: actionUrl,
    avatar: item.avatar,
    buttons: buttons,
    reason: item.reason,
    documentName: item.documentName,
    documentId: item.documentId,
    actionType: item.actionType,
    adminNote: item.adminNote,
    targetUserEmail: item.targetUserEmail
  };
};


export const notificationApi = {
  getNotifications: async (filter: string): Promise<Notification[]> => {
    const currentUser = getCurrentUser();
    try {
      const list = await userNotificationService.getNotifications(currentUser);
      const mapped = list.map(mapBackendNotification);

      const userEmail = currentUser.email;
      let filtered = mapped.filter((n: any) => {
        if (n.targetUserEmail && n.targetUserEmail.toLowerCase() !== userEmail.toLowerCase()) {
          return false;
        }
        return true;
      });

      const normalizedFilter = filter.toLowerCase().replace(/[\s-_]+/g, '');
      if (normalizedFilter === 'unread') {
        filtered = filtered.filter((n) => !n.isRead);
      } else if (normalizedFilter === 'mentions') {
        filtered = filtered.filter((n) => n.type === 'mention');
      } else if (normalizedFilter === 'sharedfiles') {
        filtered = filtered.filter((n) => n.type === 'shared_file' || n.type === 'folder' || n.type === 'document');
      } else if (normalizedFilter === 'aiupdates') {
        filtered = filtered.filter((n) => n.type === 'ai_update' || n.type === 'ai');
      }

      return filtered;
    } catch (e) {
      console.error('Failed to fetch notifications via userNotificationService', e);
    }
    return [];
  },

  markAsRead: async (id: string): Promise<void> => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
    } catch (e) {
      console.error('Failed to mark notification as read on backend', e);
    }
    window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
  }
};

