import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  aiService,
  StudioSummaryResponse,
  StudioFlashcardResponse,
  StudioQuizResponse,
  StudioFaqResponse,
} from '@/services/aiService'
import { documentService } from '@/services/documentService'
import { mapAiErrorCodeToMessage } from '@/utils/aiErrorMapper'

export function useUserDocuments(userId?: number) {
  return useQuery({
    queryKey: ['userDocuments', userId],
    queryFn: () => documentService.getAllDocuments(userId),
    enabled: true,
    staleTime: 60_000,
  })
}

export function useUserChatSessions(userId?: number) {
  return useQuery({
    queryKey: ['userChatSessions', userId],
    queryFn: () => (userId ? aiService.getUserSessions(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useChatHistory(sessionId: number | null) {
  return useQuery({
    queryKey: ['chatHistory', sessionId],
    queryFn: () => (sessionId ? aiService.getChatHistory(sessionId) : Promise.resolve([])),
    enabled: !!sessionId && sessionId > 0,
    staleTime: 10_000,
  })
}

// Helper to normalize & sort document IDs
export const getSortedDocIdsKey = (documentIds: number[]): string => {
  return [...documentIds].map(Number).sort((a, b) => a - b).join(',')
}

// ── Mutations for AI Studio features ──

export function useStudioSummaryMutation() {
  return useMutation({
    mutationFn: async ({
      documentIds,
      language = 'vi',
      forceRegenerate = false,
    }: {
      documentIds: number[]
      language?: string
      forceRegenerate?: boolean
    }): Promise<StudioSummaryResponse> => {
      const sortedIds = [...documentIds].map(Number).sort((a, b) => a - b)
      return aiService.generateStudioSummary(sortedIds, language, forceRegenerate)
    },
  })
}

export function useStudioFlashcardsMutation() {
  return useMutation({
    mutationFn: async ({
      documentIds,
      language = 'vi',
      forceRegenerate = false,
    }: {
      documentIds: number[]
      language?: string
      forceRegenerate?: boolean
    }): Promise<StudioFlashcardResponse[]> => {
      const sortedIds = [...documentIds].map(Number).sort((a, b) => a - b)
      return aiService.generateStudioFlashcards(sortedIds, language, forceRegenerate)
    },
  })
}

export function useStudioQuizMutation() {
  return useMutation({
    mutationFn: async ({
      documentIds,
      difficulty = 'medium',
      count = 5,
      language = 'vi',
      forceRegenerate = false,
    }: {
      documentIds: number[]
      difficulty?: string
      count?: number
      language?: string
      forceRegenerate?: boolean
    }): Promise<StudioQuizResponse[]> => {
      const sortedIds = [...documentIds].map(Number).sort((a, b) => a - b)
      return aiService.generateStudioQuiz(sortedIds, difficulty, count, language, forceRegenerate)
    },
  })
}

export function useStudioFaqMutation() {
  return useMutation({
    mutationFn: async ({
      documentIds,
      language = 'vi',
      forceRegenerate = false,
    }: {
      documentIds: number[]
      language?: string
      forceRegenerate?: boolean
    }): Promise<StudioFaqResponse[]> => {
      const sortedIds = [...documentIds].map(Number).sort((a, b) => a - b)
      return aiService.generateStudioFaq(sortedIds, language, forceRegenerate)
    },
  })
}
