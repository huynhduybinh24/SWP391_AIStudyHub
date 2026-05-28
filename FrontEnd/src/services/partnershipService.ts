import { CreatePartnershipRequestPayload, PartnershipRequest, PartnershipStatus } from '@/types/partnership';

const STORAGE_KEY = 'mock_partnership_requests';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStoredRequests = (): PartnershipRequest[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse partnership requests from localStorage', error);
    return [];
  }
};

const saveStoredRequests = (requests: PartnershipRequest[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
};

export const partnershipService = {
  /**
   * Submit a new partnership request
   */
  async submitRequest(payload: CreatePartnershipRequestPayload): Promise<PartnershipRequest> {
    await delay(600); // Simulate network latency

    const newRequest: PartnershipRequest = {
      ...payload,
      id: crypto.randomUUID(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const requests = getStoredRequests();
    requests.unshift(newRequest); // Add to the top
    saveStoredRequests(requests);

    return newRequest;
  },

  /**
   * Get all partnership requests for Admin
   */
  async getAllRequests(): Promise<PartnershipRequest[]> {
    await delay(400); // Simulate network latency
    return getStoredRequests();
  },

  /**
   * Update the status of a request
   */
  async updateStatus(id: string, status: PartnershipStatus, rejectReason?: string): Promise<PartnershipRequest | null> {
    await delay(500); // Simulate network latency
    
    const requests = getStoredRequests();
    const index = requests.findIndex(req => req.id === id);
    
    if (index === -1) {
      throw new Error(`Partnership request with ID ${id} not found.`);
    }

    const currentRequest = requests[index];
    const email = currentRequest.email;

    requests[index] = {
      ...currentRequest,
      status,
      rejectReason: status === 'Rejected' ? rejectReason : undefined,
      updatedAt: new Date().toISOString(),
    };

    saveStoredRequests(requests);

    // If approved/rejected, trigger user profile plan upgrade & notify
    if (typeof window !== 'undefined') {
      // 1. Upgrade user in aiStudyHubUsers
      const savedUsers = localStorage.getItem('aiStudyHubUsers');
      if (savedUsers) {
        try {
          const users = JSON.parse(savedUsers);
          let changed = false;
          const updatedUsers = users.map((u: any) => {
            if (u.email?.toLowerCase() === email?.toLowerCase() && u.role?.toLowerCase() === 'teacher') {
              if (status === 'Approved') {
                if (u.plan !== 'pro') {
                  changed = true;
                  return { ...u, plan: 'pro' };
                }
              } else if (status === 'Rejected') {
                if (u.plan === 'pro') {
                  changed = true;
                  return { ...u, plan: 'free' };
                }
              }
            }
            return u;
          });
          if (changed) {
            localStorage.setItem('aiStudyHubUsers', JSON.stringify(updatedUsers));
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('aiStudyHubUsersUpdated'));
          }
        } catch (e) {
          console.error('Error upgrading/downgrading teacher plan in localStorage', e);
        }
      }

      // 2. Dispatch mock Notification and mock Email
      try {
        // Notification
        const { userNotificationService } = await import('@/features/notifications/services/userNotificationService');
        
        const title = status === 'Approved' ? 'Partnership Approved! 🚀' : 'Partnership Update ❌';
        const message = status === 'Approved'
          ? 'Congratulations! Your partnership request has been approved and your account is upgraded to PRO plan with 50 GB storage.'
          : `We regret to inform you that your partnership request was declined. Reason: ${rejectReason || 'No reason provided.'}`;
        
        userNotificationService.addUserNotification({
          type: 'system',
          title,
          message,
          targetUserEmail: email,
          adminNote: rejectReason
        });

        // Email (simulated by adding to local storage mock_sent_emails)
        const savedEmails = localStorage.getItem('mock_sent_emails') || '[]';
        const emails = JSON.parse(savedEmails);
        emails.unshift({
          id: crypto.randomUUID(),
          to: email,
          subject: status === 'Approved' ? 'Partnership Request Approved' : 'Partnership Request Update',
          body: status === 'Approved' 
            ? `Dear ${currentRequest.fullName},\n\nWe are excited to inform you that your partnership request has been approved! Your teacher account has been upgraded to a PRO subscription with 50 GB of premium cloud storage for free.\n\nEnjoy the upgraded benefits!\n\nBest Regards,\nAI Study Hub Team`
            : `Dear ${currentRequest.fullName},\n\nThank you for your interest in partnering with us. Unfortunately, we are unable to approve your partnership request at this time.\n\nFeedback/Reason:\n${rejectReason || 'No reason provided.'}\n\nIf you have any questions, feel free to reply to this email.\n\nBest Regards,\nAI Study Hub Team`,
          sentAt: new Date().toISOString()
        });
        localStorage.setItem('mock_sent_emails', JSON.stringify(emails));
        window.dispatchEvent(new Event('mockEmailsUpdated'));
      } catch (err) {
        console.error('Error dispatching notifications/emails', err);
      }
    }

    return requests[index];
  }
};
