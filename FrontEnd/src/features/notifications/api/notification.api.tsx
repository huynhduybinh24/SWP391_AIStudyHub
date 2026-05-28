import React from 'react';
import { Folder, Calendar, ExternalLink, Eye } from 'lucide-react';
import { getCurrentUser } from '../services/userNotificationService';

export type NotificationType = 'ai' | 'folder' | 'mention' | 'security' | 'document' | 'calendar' | 'flashcard' | 'document_deleted' | 'document_rejected';

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

// Helper to get read state
const getReadStateMap = (): Record<string, boolean> => {
  try {
    const userEmail = getCurrentUser().email;
    const stored = localStorage.getItem(`aiStudyHubNotificationReadState:${userEmail}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to read notification read state from localStorage', err);
  }
  return {
    'ai-summary': false,
    'shared-folder': false,
    'emily': false,
    'security-alert': false,
    'study-plan': false,
    'mention-2': true,
    'shared-doc-1': true,
    'flashcards': true,
    'all-3': true,
    'new-report-submitted': false,
    'ai-audit-flagged': false,
    'system-status-updated': true,
  };
};

const saveReadStateMap = (map: Record<string, boolean>) => {
  try {
    const userEmail = getCurrentUser().email;
    localStorage.setItem(`aiStudyHubNotificationReadState:${userEmail}`, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save notification read state', err);
  }
};

const getPersistedUserNotifications = (): Notification[] => {
  try {
    const userEmail = getCurrentUser().email;
    const stored = localStorage.getItem(`aiStudyHubUserNotifications:${userEmail}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Filter out notifications older than 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const validList = parsed.filter((item: any) => {
        const timestamp = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
        return timestamp >= sevenDaysAgo;
      });

      if (validList.length !== parsed.length) {
        localStorage.setItem(`aiStudyHubUserNotifications:${userEmail}`, JSON.stringify(validList));
      }

      return validList.map((item: any) => ({
        id: item.id,
        type: item.type as NotificationType,
        title: item.title,
        time: item.time || 'Just now',
        isRead: !!item.isRead,
        description: item.message || item.description,
        reason: item.reason,
        documentName: item.documentName,
        documentId: item.documentId,
        actionType: item.actionType,
        adminNote: item.adminNote,
        targetUserEmail: item.targetUserEmail,
      }));
    }
  } catch (err) {
    console.error('Failed to read aiStudyHubUserNotifications', err);
  }
  return [];
};

// Base mock data without isRead
const getBaseNotifications = (): Omit<Notification, 'isRead'>[] => {
  const currentUser = getCurrentUser();
  if (currentUser.role === 'admin') {
    return [
      {
        id: 'new-report-submitted',
        type: 'security',
        title: 'New report submitted',
        time: '10m ago',
        description: 'A user reported a document for plagiarism.',
      },
      {
        id: 'ai-audit-flagged',
        type: 'ai',
        title: 'AI audit flagged a document',
        time: '1h ago',
        description: 'AI Guard detected a potential policy violation.',
      },
      {
        id: 'system-status-updated',
        type: 'calendar',
        title: 'System status updated',
        time: '3h ago',
        description: 'Maintenance mode or incident status was changed.',
      }
    ];
  }

  return [
    {
      id: 'ai-summary',
      type: 'ai',
      title: 'AI Summary Ready',
      time: '10m ago',
      description: (
        <>
          The comprehensive summary for your document{' '}
          <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
            "Advanced Neuroscience Syllabus 2024.pdf"
          </strong>{' '}
          is now complete and ready for review.
        </>
      ),
      actionText: 'View Summary',
      actionUrl: '/dashboard/notifications/summary',
    },
    {
      id: 'shared-folder',
      type: 'folder',
      title: 'Sarah Jenkins shared a folder with you',
      time: '2h ago',
      description: (
        <>
          Folder: <span className="font-semibold text-[#0b1c30] dark:text-slate-100">Group Project Research Materials</span>
        </>
      ),
      buttons: [
        {
          text: 'Open Folder',
          variant: 'shared-btn',
          icon: <Folder className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
          url: '/dashboard/shared-files/research-materials',
        },
      ],
    },
    {
      id: 'emily',
      type: 'mention',
      title: 'Emily R. mentioned you',
      time: '1h ago',
      description: (
        <>
          <span className="text-[#3155F6] dark:text-blue-400 font-semibold">@User</span>, what do you think about the methodology section on page 4 of the 'Cognitive Science' paper?
        </>
      ),
      actionText: 'Reply',
    },
    {
      id: 'all-3',
      type: 'mention',
      title: 'Mentioned You',
      time: 'Yesterday',
      avatar: '/emily.png',
      description: (
        <>
          Emily R. mentioned you in a comment on{' '}
          <span className="text-[#3155F6] dark:text-blue-400 hover:underline cursor-pointer font-semibold">
            Lecture Notes Week 4.
          </span>
        </>
      ),
      quote: '@You could you verify the formulas used in section 3? They seem slightly different from the textbook.',
      actionText: 'Reply',
    },
    {
      id: 'security-alert',
      type: 'security',
      title: 'Security Alert: New Login',
      time: '35m ago',
      description: (
        <>
          A new login was detected on your account from a Chrome browser on a MacOS device. If this wasn\'t you, please secure your account immediately.
        </>
      ),
      buttons: [
        { text: 'Review Activity', variant: 'primary' },
        { text: 'It was me', variant: 'light' },
      ],
    },
    {
      id: 'study-plan',
      type: 'calendar',
      title: 'Study Plan Generated',
      time: '4h ago',
      description: (
        <>
          AI has created a personalized 4-week study plan for{' '}
          <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
            "Organic Chemistry"
          </strong>{' '}
          based on your recent uploads.
        </>
      ),
      buttons: [
        {
          text: 'Open Plan',
          variant: 'secondary',
          icon: <Calendar className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
          url: '/dashboard/study-plans',
        },
      ],
    },
    {
      id: 'mention-2',
      type: 'mention',
      title: 'Sarah Mitchell mentioned you',
      time: '4h ago',
      description: (
        <>
          Sarah Mitchell mentioned you in a comment on{' '}
          <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
            \'Neuroscience_Ch4_Syn...\'
          </strong>
          : "@Sarah Mitchell, check the synaptic plasticity diagram on page 12."
        </>
      ),
      actionText: 'View Comment',
      actionUrl: '/dashboard/shared-files/research-materials',
    },
    {
      id: 'shared-doc-1',
      type: 'document',
      title: 'Alex Chen shared a document',
      time: '5h ago',
      description: (
        <>
          Document: <span className="font-semibold text-[#0b1c30] dark:text-slate-100">Advanced Neuroscience Syllabus 2024.pdf</span>
        </>
      ),
      buttons: [
        {
          text: 'View Document',
          variant: 'shared-btn',
          icon: <Eye className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
          url: '/dashboard/notifications/summary',
        },
      ],
    },
    {
      id: 'flashcards',
      type: 'flashcard',
      title: 'New Flashcards Available',
      time: 'Yesterday',
      description: (
        <>
          25 new flashcards have been automatically generated for{' '}
          <strong className="font-semibold text-[#0b1c30] dark:text-slate-100">
            "Cell Biology - Week 4"
          </strong>.
        </>
      ),
      buttons: [
        {
          text: 'Practice Now',
          variant: 'secondary',
          icon: <ExternalLink className="w-3.5 h-3.5 text-[#3155F6] dark:text-blue-400" />,
          url: '/dashboard/quizzes',
        },
      ],
    },
  ];
};

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, 0));

export const notificationApi = {
  getNotifications: async (filter: string): Promise<Notification[]> => {
    await simulateNetworkDelay();
    
    const readState = getReadStateMap();
    const baseData = getBaseNotifications().map(item => ({
      ...item,
      isRead: !!readState[item.id]
    }));

    const persisted = getPersistedUserNotifications();
    const merged = [...persisted, ...baseData];

    const currentUser = getCurrentUser();
    let deletedIds: string[] = [];
    try {
      const storedDeleted = localStorage.getItem(`aiStudyHubDeletedNotificationIds:${currentUser.email}`);
      if (storedDeleted) {
        deletedIds = JSON.parse(storedDeleted);
      }
    } catch (e) {
      console.error('Failed to parse deleted notification IDs', e);
    }

    const filteredMerged = merged.filter(item => {
      // 1. If it's deleted, filter out
      if (deletedIds.includes(item.id)) return false;

      // 2. targetUserEmail check
      if (item.targetUserEmail && item.targetUserEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
        return false;
      }

      // 3. Admin safety filters
      if (currentUser.role === 'admin') {
        const typeStr = item.type || '';
        if (typeStr === 'document_deleted' || typeStr === 'document_rejected' || typeStr === 'document_removed') {
          if (!item.targetUserEmail || item.targetUserEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
            return false;
          }
        }
        const descStr = typeof item.description === 'string' ? item.description : '';
        if ((descStr.startsWith('Your document') || descStr.startsWith('Tài liệu')) && !item.targetUserEmail) {
          return false;
        }
      }

      return true;
    });

    switch (filter) {
      case 'unread':
        return filteredMerged.filter(item => !item.isRead);
      case 'mentions':
        return filteredMerged.filter(item => item.type === 'mention' || item.id === 'emily' || item.id === 'mention-2');
      case 'shared-files':
      case 'sharedfiles':
        return filteredMerged.filter(
          item =>
            String(item.type) === 'shared_file' ||
            item.type === 'folder' ||
            item.type === 'document' ||
            item.id === 'shared-folder' ||
            item.id === 'shared-doc-1' ||
            String(item.type).toLowerCase().includes('shared') ||
            String(item.type).toLowerCase().includes('file') ||
            String(item.type).toLowerCase().includes('folder') ||
            String(item.type).toLowerCase().includes('document')
        );
      case 'ai-updates':
      case 'aiupdates':
        return filteredMerged.filter(
          item =>
            String(item.type) === 'ai_update' ||
            item.type === 'ai' ||
            item.type === 'flashcard' ||
            item.type === 'calendar' ||
            String(item.type) === 'study_plan' ||
            item.id === 'ai-summary' ||
            item.id === 'study-plan' ||
            item.id === 'flashcards' ||
            item.id === 'ai-audit-flagged' ||
            String(item.type).toLowerCase().includes('ai') ||
            String(item.type).toLowerCase().includes('flash') ||
            String(item.type).toLowerCase().includes('study') ||
            String(item.type).toLowerCase().includes('quiz')
        );
      case 'all':
      default:
        return filteredMerged;
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    let changed = false;
    try {
      const userEmail = getCurrentUser().email;
      const stored = localStorage.getItem(`aiStudyHubUserNotifications:${userEmail}`);
      if (stored) {
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed = parsed.map((item: any) => {
            if (item.id === id && !item.isRead) {
              changed = true;
              return { ...item, isRead: true };
            }
            return item;
          });
          if (changed) {
            localStorage.setItem(`aiStudyHubUserNotifications:${userEmail}`, JSON.stringify(parsed));
          }
        }
      }
    } catch (e) {
      console.error('Failed to update persisted notification read state', e);
    }

    try {
      const readState = getReadStateMap();
      if (!readState[id]) {
        readState[id] = true;
        saveReadStateMap(readState);
        changed = true;
      }
    } catch (e) {
      console.error('Failed to update mock notification read state', e);
    }

    if (changed) {
      window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
    }
  }
};

