import { useToastStore } from '@/stores/toastStore';
import { getCurrentUser } from '@/features/notifications/services/userNotificationService';

export type NotificationType = 'ai' | 'folder' | 'mention' | 'security' | 'document' | 'calendar' | 'flashcard' | 'document_deleted';

export interface RealtimeNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  createdAt: string;
}

class NotificationRealtimeManager {
  private socket: WebSocket | null = null;
  private reconnectTimeout: any = null;
  private simulationInterval: any = null;
  private wsUrl: string = import.meta.env.VITE_API_REALTIME_URL || 'ws://localhost:8080/api/notifications/ws';
  private isSimulationActive: boolean = false;


  // List of pre-defined realistic notifications to simulate for normal users
  private simulationPool = [
    {
      type: 'ai' as NotificationType,
      title: 'AI Summary Ready',
      description: 'The comprehensive summary for your document "Data Science Intro.pdf" is now complete and ready.',
    },
    {
      type: 'folder' as NotificationType,
      title: 'Duy Binh shared a folder with you',
      description: 'Folder: "SWE301 Final Exam Prep Materials"',
    },
    {
      type: 'mention' as NotificationType,
      title: 'Sarah Mitchell mentioned you',
      description: '@User, please check the database schema design in Chapter 3 notes.',
    },
    {
      type: 'security' as NotificationType,
      title: 'Security Alert: New Login',
      description: 'A new login was detected on your account from Firefox on Windows 11.',
    },
    {
      type: 'calendar' as NotificationType,
      title: 'Study Plan Generated',
      description: 'AI has created a personalized 2-week study plan for "Discrete Mathematics".',
    },
    {
      type: 'flashcard' as NotificationType,
      title: 'New Flashcards Available',
      description: '20 new flashcards have been automatically generated for "Human-Computer Interaction".',
    },
  ];

  // List of pre-defined realistic notifications to simulate for Admin users
  private adminSimulationPool = [
    {
      type: 'security' as NotificationType,
      title: 'New Partnership Request',
      description: 'A new teacher partnership request has been submitted by Ngoc Tan (High School).',
    },
    {
      type: 'security' as NotificationType,
      title: 'New Deletion/Plagiarism Report',
      description: 'A student reported "Intro to Biology" for plagiarism.',
    },
    {
      type: 'ai' as NotificationType,
      title: 'AI Guard Alert: Flagged Document',
      description: 'AI Guard detected a potential policy violation in "Hacking Manual 101.pdf".',
    },
    {
      type: 'calendar' as NotificationType,
      title: 'System Health Status',
      description: 'All AI processing pipelines are running normally.',
    }
  ];

  constructor() {
    // Expose control to the window object so devs can trigger simulations easily!
    if (typeof window !== 'undefined') {
      (window as any).simulateNotification = (
        type?: NotificationType,
        title?: string,
        description?: string
      ) => {
        this.injectSimulatedNotification(type, title, description);
      };
    }
  }

  public connect() {
    if (this.socket) return;

    console.log(`[Realtime] Attempting connection to WebSocket: ${this.wsUrl}`);
    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        console.log('[Realtime] WebSocket connected successfully!');
        this.stopSimulation();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingNotification(data);
        } catch (err) {
          console.error('[Realtime] Failed to parse websocket message:', err);
        }
      };

      this.socket.onerror = (error) => {
        console.warn('[Realtime] WebSocket error encountered. Backend might be down.', error);
      };

      this.socket.onclose = () => {
        console.log('[Realtime] WebSocket disconnected. Retrying in 10s...');
        this.socket = null;
        this.startReconnectTimer();
        this.startSimulation(); // Fallback to simulated notifications in Frontend-only mode
      };
    } catch (err) {
      console.warn('[Realtime] Failed to create WebSocket instance. Starting simulator fallback.');
      this.startSimulation();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopSimulation();
  }

  private startReconnectTimer() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      console.log('[Realtime] Reconnection attempt triggered...');
      this.connect();
    }, 10000);
  }

  private startSimulation() {
    if (this.isSimulationActive) return;
    this.isSimulationActive = true;
    console.log('[Realtime] Mock Real-time Simulator Activated. A mock notification will be sent every 60s.');
    console.log('[Realtime] Pro-tip: You can trigger one manually by running `simulateNotification()` in your browser console!');

    // Simulate a notification every 60 seconds
    this.simulationInterval = setInterval(() => {
      this.injectSimulatedNotification();
    }, 60000);
  }

  private stopSimulation() {
    this.isSimulationActive = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private handleIncomingNotification(data: any) {
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('aiStudyHubCurrentUser');
      if (!currentUser) {
        return; // Skip notifications if user is not logged in
      }
    }

    const newNotif: RealtimeNotification = {
      id: data.id || `realtime-${Date.now()}`,
      type: data.type || 'ai',
      title: data.title || 'New Notification',
      description: data.description || data.message || '',
      time: 'Just now',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    // 1. Save to localStorage to persist notifications list
    this.persistNotification(newNotif);

    // 2. Dispatch custom event to notify React components to update in real-time
    this.dispatchUpdateEvent();

    // 3. Show beautiful Toast alert on the screen
    this.showToast(newNotif);
  }

  public injectSimulatedNotification(
    type?: NotificationType,
    title?: string,
    description?: string
  ) {
    let isUserAdmin = false;
    if (typeof window !== 'undefined') {
      const currentUserStr = localStorage.getItem('aiStudyHubCurrentUser');
      if (currentUserStr) {
        try {
          const user = JSON.parse(currentUserStr);
          isUserAdmin = user?.role?.toLowerCase() === 'admin';
        } catch (e) {}
      }
    }

    const currentPool = isUserAdmin ? this.adminSimulationPool : this.simulationPool;
    let mock = currentPool[Math.floor(Math.random() * currentPool.length)];
    if (type || title || description) {
      mock = {
        type: type || 'ai',
        title: title || 'System Update',
        description: description || 'New real-time sync event received successfully.',
      };
    }

    const mockData = {
      id: `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: mock.type,
      title: mock.title,
      message: mock.description, // Matches the localStorage notification.api parse key
      time: 'Just now',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    console.log(`[Realtime Simulator] Dispatching mock event:`, mockData);
    this.handleIncomingNotification(mockData);
  }

  private persistNotification(notif: RealtimeNotification) {
    try {
      const userEmail = getCurrentUser().email;
      const key = `aiStudyHubUserNotifications:${userEmail}`;
      const stored = localStorage.getItem(key);
      let currentNotifs = stored ? JSON.parse(stored) : [];
      
      // Map to correct storage keys
      const mapped = {
        id: notif.id,
        type: notif.type === 'document_deleted' ? 'document_deleted' : notif.type,
        title: notif.title,
        message: notif.description,
        time: notif.time,
        isRead: notif.isRead,
        createdAt: notif.createdAt,
      };

      currentNotifs = [mapped, ...currentNotifs];
      
      // Limit to 50 items to keep localStorage clean
      if (currentNotifs.length > 50) {
        currentNotifs = currentNotifs.slice(0, 50);
      }

      localStorage.setItem(key, JSON.stringify(currentNotifs));
    } catch (err) {
      console.error('[Realtime] Failed to persist notification:', err);
    }
  }

  private dispatchUpdateEvent() {
    window.dispatchEvent(new Event('aiStudyHubNotificationsUpdated'));
  }

  private showToast(notif: RealtimeNotification) {
    // Map notification types to appropriate toast statuses
    let toastType: 'success' | 'info' | 'warning' | 'error' = 'info';
    
    if (notif.type === 'security' || notif.type === 'document_deleted') {
      toastType = 'warning';
    } else if (notif.type === 'ai' || notif.type === 'flashcard' || notif.type === 'calendar') {
      toastType = 'success';
    }

    // Call global toast store
    useToastStore.getState().addToast(
      `${notif.title}: ${notif.description}`,
      toastType,
      4000
    );
  }
}

export const realtimeNotificationManager = new NotificationRealtimeManager();
