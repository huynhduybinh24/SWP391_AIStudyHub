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
  documents?: any[]
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
  completedLessonsJson?: string
  createdAt: string
}

// AI Studio Interfaces
export interface StudioSummaryResponse {
  summaryText: string
  keyBullets: string[]
}

export interface StudioMindmapResponse {
  mermaidCode: string
}

export interface InfographicItem {
  label: string
  value: string
  description: string
  iconType: 'brain' | 'lightbulb' | 'chart' | 'star'
}

export interface StudioInfographicResponse {
  title: string
  subtitle: string
  items: InfographicItem[]
}

export interface StudioFlashcardResponse {
  front: string
  back: string
}

export interface StudioQuizResponse {
  questionText: string
  options: string[]
  answerIndex: number
  explanation: string
}

export interface StudioFaqResponse {
  question: string
  answer: string
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

  async createOrGetChatSession(documentIds: number[], userId: number): Promise<AiChatSessionResponse> {
    const response = await apiClient.post<ApiResponse<AiChatSessionResponse>>('/ai/chat/session', {
      documentIds,
      userId,
    })
    return response.data.data
  },

  async getUserSessions(userId: number): Promise<AiChatSessionResponse[]> {
    const response = await apiClient.get<ApiResponse<AiChatSessionResponse[]>>(`/ai/chat/sessions?userId=${userId}`)
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
  },

  async getCompletedLessons(planId: number | string): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(`/ai/study-plans/${planId}/completed-lessons`)
      return response.data.data || []
    } catch {
      return []
    }
  },

  async updateCompletedLessons(planId: number | string, lessonIds: string[]): Promise<string[]> {
    const response = await apiClient.put<ApiResponse<string[]>>(
      `/ai/study-plans/${planId}/completed-lessons`,
      { lessonIds }
    )
    return response.data.data || []
  },

  async saveStudyPlan(plan: Partial<StudyPlanResponse>): Promise<StudyPlanResponse> {
    const response = await apiClient.post<ApiResponse<StudyPlanResponse>>('/ai/study-plans', plan)
    return response.data.data
  },

  async updateStudyPlan(id: number | string, plan: Partial<StudyPlanResponse>): Promise<StudyPlanResponse> {
    const response = await apiClient.put<ApiResponse<StudyPlanResponse>>(`/ai/study-plans/${id}`, plan)
    return response.data.data
  },

  async deleteStudyPlan(id: number | string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/ai/study-plans/${id}`)
  },

  // AI Studio Features
  async generateStudioSummary(documentIds: number[], language = 'vi'): Promise<StudioSummaryResponse> {
    const response = await apiClient.post<ApiResponse<StudioSummaryResponse>>('/ai/studio/summary', { documentIds, language })
    return response.data.data
  },

  async generateStudioMindmap(documentIds: number[], language = 'vi'): Promise<StudioMindmapResponse> {
    const response = await apiClient.post<ApiResponse<StudioMindmapResponse>>('/ai/studio/mindmap', { documentIds, language })
    return response.data.data
  },

  async generateStudioInfographic(documentIds: number[], language = 'vi'): Promise<StudioInfographicResponse> {
    const response = await apiClient.post<ApiResponse<StudioInfographicResponse>>('/ai/studio/infographic', { documentIds, language })
    return response.data.data
  },

  async generateStudioFlashcards(documentIds: number[], language = 'vi'): Promise<StudioFlashcardResponse[]> {
    const response = await apiClient.post<ApiResponse<StudioFlashcardResponse[]>>('/ai/studio/flashcards', { documentIds, language })
    return response.data.data
  },

  async generateStudioQuiz(documentIds: number[], difficulty = 'medium', count = 5, language = 'vi'): Promise<StudioQuizResponse[]> {
    const response = await apiClient.post<ApiResponse<StudioQuizResponse[]>>('/ai/studio/quiz', { documentIds, difficulty, count, language })
    return response.data.data
  },

  async generateStudioFaq(documentIds: number[], language = 'vi'): Promise<StudioFaqResponse[]> {
    const response = await apiClient.post<ApiResponse<StudioFaqResponse[]>>('/ai/studio/faq', { documentIds, language })
    return response.data.data
  }
}
