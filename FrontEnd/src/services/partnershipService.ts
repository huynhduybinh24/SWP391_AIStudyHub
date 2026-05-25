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
  async updateStatus(id: string, status: PartnershipStatus): Promise<PartnershipRequest | null> {
    await delay(500); // Simulate network latency
    
    const requests = getStoredRequests();
    const index = requests.findIndex(req => req.id === id);
    
    if (index === -1) {
      throw new Error(`Partnership request with ID ${id} not found.`);
    }

    requests[index] = {
      ...requests[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    saveStoredRequests(requests);
    return requests[index];
  }
};
