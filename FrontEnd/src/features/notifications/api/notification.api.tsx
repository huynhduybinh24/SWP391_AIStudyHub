import React from 'react';
import { Folder, Calendar, ExternalLink, Eye } from 'lucide-react';

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
}

// Helper to get read state
const getReadStateMap = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem('aiStudyHubNotificationReadState');
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
  };
};

const saveReadStateMap = (map: Record<string, boolean>) => {
  try {
    localStorage.setItem('aiStudyHubNotificationReadState', JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save notification read state', err);
  }
};

const getPersistedUserNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem('aiStudyHubUserNotifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
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
      }));
    }
  } catch (err) {
    console.error('Failed to read aiStudyHubUserNotifications', err);
  }
  return [];
};

// Base mock data without isRead
const getBaseNotifications = (): Omit<Notification, 'isRead'>[] => [
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
        A new login was detected on your account from a Chrome browser on a MacOS device. If this wasn't you, please secure your account immediately.
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
          'Neuroscience_Ch4_Syn...'
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

const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, 800));

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

    let deletedIds: string[] = [];
    try {
      const storedDeleted = localStorage.getItem('aiStudyHubDeletedNotificationIds');
      if (storedDeleted) {
        deletedIds = JSON.parse(storedDeleted);
      }
    } catch (e) {
      console.error('Failed to parse deleted notification IDs', e);
    }

    const filteredMerged = merged.filter(item => !deletedIds.includes(item.id));

    switch (filter) {
      case 'unread':
        return filteredMerged.filter(item => !item.isRead);
      case 'mentions':
        return filteredMerged.filter(item => item.id === 'emily' || item.id === 'mention-2');
      case 'shared-files':
      case 'sharedfiles':
        return filteredMerged.filter(item => item.id === 'shared-folder' || item.id === 'shared-doc-1');
      case 'ai-updates':
      case 'aiupdates':
        return filteredMerged.filter(item => item.id === 'ai-summary' || item.id === 'study-plan' || item.id === 'flashcards');
      case 'all':
      default:
        // By original logic, "All" shows specific 3 notifications
        return filteredMerged.filter(item => item.type === 'document_deleted' || item.type === 'document_rejected' || item.id === 'ai-summary' || item.id === 'shared-folder' || item.id === 'all-3');
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    // We don't simulate delay here for snappy UI, or we can just simulate a tiny one.
    try {
      const stored = localStorage.getItem('aiStudyHubUserNotifications');
      if (stored) {
        let parsed = JSON.parse(stored);
        let found = false;
        parsed = parsed.map((item: any) => {
          if (item.id === id) {
            found = true;
            return { ...item, isRead: true };
          }
          return item;
        });
        if (found) {
          localStorage.setItem('aiStudyHubUserNotifications', JSON.stringify(parsed));
          window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
        }
      }
    } catch (e) {}

    const readState = getReadStateMap();
    if (!readState[id]) {
      readState[id] = true;
      saveReadStateMap(readState);
    }
  }
};
