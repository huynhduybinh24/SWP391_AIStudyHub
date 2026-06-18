import React from 'react';
import { Folder, Calendar, ExternalLink, Eye } from 'lucide-react';
import { getCurrentUser, userNotificationService } from '../services/userNotificationService';
import { apiClient } from '@/lib/axios';

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
  let buttons: NotificationButton[] | undefined = undefined;

  if (type === 'folder') {
    buttons = [{
      text: 'Open Folder',
      variant: 'shared-btn',
      icon: <Folder className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
      url: item.actionUrl || '/dashboard/shared-files/research-materials'
    }];
  } else if (type === 'document') {
    buttons = [{
      text: 'View Document',
      variant: 'shared-btn',
      icon: <Eye className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
      url: item.actionUrl || '/dashboard/notifications/summary'
    }];
  } else if (type === 'calendar') {
    buttons = [{
      text: 'Open Plan',
      variant: 'secondary',
      icon: <Calendar className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
      url: item.actionUrl || '/dashboard/study-plans'
    }];
  } else if (type === 'flashcard') {
    buttons = [{
      text: 'Practice Now',
      variant: 'secondary',
      icon: <ExternalLink className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
      url: item.actionUrl || '/dashboard/quizzes'
    }];
  } else if (type === 'security') {
    buttons = [
      { text: 'Review Activity', variant: 'primary', url: item.actionUrl || '#' },
      { text: 'It was me', variant: 'light', url: '#' }
    ];
  }

  return {
    id: String(item.id),
    type: type,
    title: item.title,
    time: item.time || 'Just now',
    isRead: !!item.isRead,
    description: item.description || item.message,
    quote: item.quote,
    actionText: item.actionText,
    actionUrl: item.actionUrl,
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

