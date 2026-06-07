import { apiClient } from '@/lib/axios'
import { ApiResponse } from './documentService'

export interface AiSummaryResponse {
  id: number
  documentId: number
  language: string
  summaryText: string
  summaryBullets: string // String containing JSON
  createdAt: string
  updatedAt: string
}

export interface AiChatSessionResponse {
  id: number
  documentId?: number
  userId: number
  title?: string
  createdAt: string
  updatedAt: string
}

export interface AiChatMessageResponse {
  id: number
  sessionId: number
  sender: 'USER' | 'AI'
  messageText: string
  thought?: string
  createdAt: string
}

export interface FlashcardResponse {
  id: number
  documentId: number
  question: string
  answer: string
  createdAt: string
}

export interface QuizQuestionResponse {
  id: number
  documentId: number
  q: string
  options: string // String containing JSON of choices
  answer: number
  explain: string
  createdAt: string
}

export interface StudyPlanResponse {
  id: number
  userId: number
  title: string
  subject: string
  planText: string
  documentId?: number
  sourceDocuments?: any[]
  curriculumJson?: string
  createdAt: string
}

export const aiService = {
  async generateSummary(documentId: number | string, language = 'vi'): Promise<AiSummaryResponse> {
    const response = await apiClient.post<ApiResponse<AiSummaryResponse>>(`/ai/summary/generate?documentId=${documentId}&language=${language}`)
    return response.data.data
  },

  async getSummary(documentId: number | string, language = 'vi'): Promise<AiSummaryResponse> {
    const response = await apiClient.get<ApiResponse<AiSummaryResponse>>(`/ai/summary/${documentId}?language=${language}`)
    return response.data.data
  },

  async createOrGetChatSession(documentId: number | string | null, userId: number): Promise<AiChatSessionResponse> {
    const response = await apiClient.post<ApiResponse<AiChatSessionResponse>>('/ai/chat/session', {
      documentId: documentId ? Number(documentId) : null,
      userId,
    })
    return response.data.data
  },

  async getChatHistory(sessionId: number | string): Promise<AiChatMessageResponse[]> {
    const response = await apiClient.get<ApiResponse<AiChatMessageResponse[]>>(`/ai/chat/messages?sessionId=${sessionId}`)
    return response.data.data
  },

  async sendMessage(sessionId: number | string, messageText: string, thinkingMode = false): Promise<AiChatMessageResponse> {
    const response = await apiClient.post<ApiResponse<AiChatMessageResponse>>('/ai/chat/send', {
      sessionId: Number(sessionId),
      messageText,
      thinkingMode
    })
    return response.data.data
  },

  async getFlashcards(documentId: number | string): Promise<FlashcardResponse[]> {
    const response = await apiClient.get<ApiResponse<FlashcardResponse[]>>(`/ai/flashcards/${documentId}`)
    return response.data.data
  },

  async generateQuiz(
    documentId: number | string,
    difficulty = 'medium',
    count = 10,
    prompt = ''
  ): Promise<QuizQuestionResponse[]> {
    const response = await apiClient.get<ApiResponse<QuizQuestionResponse[]>>(
      `/ai/quiz/generate?documentId=${documentId}&difficulty=${difficulty}&count=${count}&prompt=${encodeURIComponent(prompt)}`
    )
    return response.data.data
  },

  async modifyQuizWithAi(documentId: number | string, prompt: string): Promise<QuizQuestionResponse[]> {
    const response = await apiClient.post<ApiResponse<QuizQuestionResponse[]>>('/ai/quiz/modify', {
      documentId: Number(documentId),
      prompt,
    })
    return response.data.data
  },

  async getQuiz(documentId: number | string): Promise<QuizQuestionResponse[]> {
    const response = await apiClient.get<ApiResponse<QuizQuestionResponse[]>>(`/ai/quiz/${documentId}`)
    return response.data.data
  },

  async generateStudyPlan(
    userId: number,
    subject: string,
    goal: string,
    durationWeeks: number,
    documentIds?: number[]
  ): Promise<StudyPlanResponse> {
    const response = await apiClient.post<ApiResponse<StudyPlanResponse>>('/ai/study-plans/generate', {
      userId,
      subject,
      goal,
      durationWeeks,
      documentIds: documentIds || []
    })
    return response.data.data
  },

  async getStudyPlans(userId: number): Promise<StudyPlanResponse[]> {
    const response = await apiClient.get<ApiResponse<StudyPlanResponse[]>>(`/ai/study-plans/user/${userId}`)
    return response.data.data
  }
}
