import { apiClient } from '@/lib/axios'
import type {
  PromptSummary,
  PromptVersionSummary,
  PromptDiffResponse,
  AiExecutionLogSummary,
  PromptReviewHistorySummary,
  CreatePromptRequest,
  UpdatePromptRequest,
  CreatePromptVersionRequest,
  UpdatePromptVersionRequest,
  ReviewPromptVersionRequest,
  RollbackPromptRequest,
  AiExecutionLogFilters,
  PageResponse,
} from '../types/prompt'

export const promptApi = {
  // Prompts CRUD
  getPrompts: async (): Promise<PromptSummary[]> => {
    const response = await apiClient.get<PromptSummary[]>('/api/admin/prompts')
    return response.data
  },

  getPromptById: async (promptId: number | string): Promise<PromptSummary> => {
    const response = await apiClient.get<PromptSummary>(`/api/admin/prompts/${promptId}`)
    return response.data
  },

  createPrompt: async (data: CreatePromptRequest): Promise<PromptSummary> => {
    const response = await apiClient.post<PromptSummary>('/api/admin/prompts', data)
    return response.data
  },

  updatePrompt: async (promptId: number | string, data: UpdatePromptRequest): Promise<PromptSummary> => {
    const response = await apiClient.put<PromptSummary>(`/api/admin/prompts/${promptId}`, data)
    return response.data
  },

  togglePromptStatus: async (promptId: number | string): Promise<PromptSummary> => {
    const response = await apiClient.patch<PromptSummary>(`/api/admin/prompts/${promptId}/status`)
    return response.data
  },

  // Versions CRUD
  getPromptVersions: async (promptId: number | string): Promise<PromptVersionSummary[]> => {
    const response = await apiClient.get<PromptVersionSummary[]>(`/api/admin/prompts/${promptId}/versions`)
    return response.data
  },

  getPromptVersionById: async (
    promptId: number | string,
    versionId: number | string,
  ): Promise<PromptVersionSummary> => {
    const response = await apiClient.get<PromptVersionSummary>(
      `/api/admin/prompts/${promptId}/versions/${versionId}`,
    )
    return response.data
  },

  createPromptVersion: async (
    promptId: number | string,
    data: CreatePromptVersionRequest,
  ): Promise<PromptVersionSummary> => {
    const response = await apiClient.post<PromptVersionSummary>(
      `/api/admin/prompts/${promptId}/versions`,
      data,
    )
    return response.data
  },

  updateDraftVersion: async (
    promptId: number | string,
    versionId: number | string,
    data: UpdatePromptVersionRequest,
  ): Promise<PromptVersionSummary> => {
    const response = await apiClient.put<PromptVersionSummary>(
      `/api/admin/prompts/${promptId}/versions/${versionId}`,
      data,
    )
    return response.data
  },

  // Workflow
  submitForReview: async (
    promptId: number | string,
    versionId: number | string,
  ): Promise<PromptVersionSummary> => {
    const response = await apiClient.post<PromptVersionSummary>(
      `/api/admin/prompts/${promptId}/versions/${versionId}/submit-review`,
    )
    return response.data
  },

  approveVersion: async (
    promptId: number | string,
    versionId: number | string,
    data?: ReviewPromptVersionRequest,
  ): Promise<PromptVersionSummary> => {
    const response = await apiClient.post<PromptVersionSummary>(
      `/api/admin/prompts/${promptId}/versions/${versionId}/approve`,
      data || {},
    )
    return response.data
  },

  rejectVersion: async (
    promptId: number | string,
    versionId: number | string,
    data: ReviewPromptVersionRequest,
  ): Promise<PromptVersionSummary> => {
    const response = await apiClient.post<PromptVersionSummary>(
      `/api/admin/prompts/${promptId}/versions/${versionId}/reject`,
      data,
    )
    return response.data
  },

  publishVersion: async (
    promptId: number | string,
    versionId: number | string,
  ): Promise<PromptVersionSummary> => {
    const response = await apiClient.post<PromptVersionSummary>(
      `/api/admin/prompts/${promptId}/versions/${versionId}/publish`,
    )
    return response.data
  },

  rollbackToVersion: async (
    promptId: number | string,
    data: RollbackPromptRequest,
  ): Promise<PromptVersionSummary> => {
    const response = await apiClient.post<PromptVersionSummary>(
      `/api/admin/prompts/${promptId}/rollback`,
      data,
    )
    return response.data
  },

  getReviewHistory: async (
    promptId: number | string,
    versionId: number | string,
  ): Promise<PromptReviewHistorySummary[]> => {
    const response = await apiClient.get<PromptReviewHistorySummary[]>(
      `/api/admin/prompts/${promptId}/versions/${versionId}/history`,
    )
    return response.data
  },

  // Diff
  getPromptDiff: async (
    promptId: number | string,
    fromVersionId: number | string,
    toVersionId: number | string,
  ): Promise<PromptDiffResponse> => {
    const response = await apiClient.get<PromptDiffResponse>(
      `/api/admin/prompts/${promptId}/diff`,
      {
        params: { fromVersionId, toVersionId },
      },
    )
    return response.data
  },

  // AI Execution Logs
  getAiExecutionLogs: async (
    filters: AiExecutionLogFilters,
  ): Promise<PageResponse<AiExecutionLogSummary>> => {
    const response = await apiClient.get<PageResponse<AiExecutionLogSummary>>(
      '/api/admin/ai-execution-logs',
      { params: filters },
    )
    return response.data
  },

  getAiExecutionLogById: async (logId: number | string): Promise<AiExecutionLogSummary> => {
    const response = await apiClient.get<AiExecutionLogSummary>(
      `/api/admin/ai-execution-logs/${logId}`,
    )
    return response.data
  },
}
