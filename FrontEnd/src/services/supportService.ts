import { apiClient } from '@/lib/axios'

export type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface SupportTicketRequest {
  name: string
  email: string
  subject: string
  message: string
}

export interface SupportTicket {
  id: number
  name: string
  email: string
  subject: string
  message: string
  status: TicketStatus
  userId: number | null
  createdAt: string
  updatedAt: string
}

export interface SupportMessage {
  id: number
  ticketId: number
  senderEmail: string
  senderName: string
  message: string
  isFromAdmin: boolean
  createdAt: string
}

export interface TicketDetail {
  ticket: SupportTicket
  messages: SupportMessage[]
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const supportService = {
  async createTicket(request: SupportTicketRequest, userId?: string | number): Promise<SupportTicket> {
    const url = userId ? `/support/tickets?userId=${userId}` : '/support/tickets'
    const response = await apiClient.post<ApiResponse<SupportTicket>>(url, request)
    return response.data.data
  },

  async getMyTickets(userId: string | number): Promise<SupportTicket[]> {
    const response = await apiClient.get<ApiResponse<SupportTicket[]>>(`/support/tickets/my?userId=${userId}`)
    return response.data.data
  },

  async getAllTickets(status?: TicketStatus): Promise<SupportTicket[]> {
    const url = status ? `/support/tickets?status=${status}` : '/support/tickets'
    const response = await apiClient.get<ApiResponse<SupportTicket[]>>(url)
    return response.data.data
  },

  async getTicketDetail(ticketId: number | string): Promise<TicketDetail> {
    const response = await apiClient.get<ApiResponse<TicketDetail>>(`/support/tickets/${ticketId}`)
    return response.data.data
  },

  async replyToTicket(
    ticketId: number | string,
    messageContent: string,
    senderName: string,
    senderEmail: string,
    isFromAdmin: boolean
  ): Promise<SupportMessage> {
    const payload = {
      messageContent,
      senderName,
      senderEmail,
      isFromAdmin
    }
    const response = await apiClient.post<ApiResponse<SupportMessage>>(`/support/tickets/${ticketId}/reply`, payload)
    return response.data.data
  },

  async updateTicketStatus(ticketId: number | string, status: TicketStatus): Promise<SupportTicket> {
    const response = await apiClient.put<ApiResponse<SupportTicket>>(`/support/tickets/${ticketId}/status?status=${status}`)
    return response.data.data
  }
}
