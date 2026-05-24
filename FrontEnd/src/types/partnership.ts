export type PartnershipStatus = 'Pending' | 'Approved' | 'Rejected';

export type PartnershipType = 
  | 'Educational Partnership'
  | 'Mentor Collaboration'
  | 'AI Integration'
  | 'Content Creator'
  | 'Business / Sponsorship'
  | 'Recruitment Collaboration'
  | 'Other';

export interface PartnershipRequest {
  id: string;
  fullName: string;
  email: string;
  organization: string;
  partnershipType: PartnershipType | string;
  message: string;
  status: PartnershipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnershipRequestPayload {
  fullName: string;
  email: string;
  organization: string;
  partnershipType: string;
  message: string;
}
