import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { promptApi } from '../api/promptApi'
import type {
  CreatePromptRequest,
  UpdatePromptRequest,
  CreatePromptVersionRequest,
  UpdatePromptVersionRequest,
  ReviewPromptVersionRequest,
  RollbackPromptRequest,
  AiExecutionLogFilters,
} from '../types/prompt'

export const promptKeys = {
  all: ['admin-prompts'] as const,
  lists: () => [...promptKeys.all, 'list'] as const,
  details: () => [...promptKeys.all, 'detail'] as const,
  detail: (promptId: string | number) => [...promptKeys.details(), String(promptId)] as const,
  versions: (promptId: string | number) => [...promptKeys.detail(promptId), 'versions'] as const,
  version: (promptId: string | number, versionId: string | number) =>
    [...promptKeys.versions(promptId), String(versionId)] as const,
  history: (promptId: string | number, versionId: string | number) =>
    [...promptKeys.version(promptId, versionId), 'history'] as const,
  diff: (promptId: string | number, fromId: string | number, toId: string | number) =>
    [...promptKeys.detail(promptId), 'diff', String(fromId), String(toId)] as const,
  logs: (filters: AiExecutionLogFilters) => ['admin-ai-execution-logs', filters] as const,
  logDetail: (logId: string | number) => ['admin-ai-execution-log', String(logId)] as const,
}

export function usePrompts() {
  return useQuery({
    queryKey: promptKeys.lists(),
    queryFn: () => promptApi.getPrompts(),
  })
}

export function usePrompt(promptId?: string | number) {
  return useQuery({
    queryKey: promptKeys.detail(promptId ?? ''),
    queryFn: () => promptApi.getPromptById(promptId!),
    enabled: !!promptId,
  })
}

export function useCreatePrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePromptRequest) => promptApi.createPrompt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() })
    },
  })
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ promptId, data }: { promptId: number | string; data: UpdatePromptRequest }) =>
      promptApi.updatePrompt(promptId, data),
    onSuccess: (_, { promptId }) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() })
      queryClient.invalidateQueries({ queryKey: promptKeys.detail(promptId) })
    },
  })
}

export function useTogglePromptStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (promptId: number | string) => promptApi.togglePromptStatus(promptId),
    onSuccess: (_, promptId) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() })
      queryClient.invalidateQueries({ queryKey: promptKeys.detail(promptId) })
    },
  })
}

export function usePromptVersions(promptId?: string | number) {
  return useQuery({
    queryKey: promptKeys.versions(promptId ?? ''),
    queryFn: () => promptApi.getPromptVersions(promptId!),
    enabled: !!promptId,
  })
}

export function usePromptVersion(promptId?: string | number, versionId?: string | number) {
  return useQuery({
    queryKey: promptKeys.version(promptId ?? '', versionId ?? ''),
    queryFn: () => promptApi.getPromptVersionById(promptId!, versionId!),
    enabled: !!promptId && !!versionId,
  })
}

export function useCreatePromptVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      promptId,
      data,
    }: {
      promptId: number | string
      data: CreatePromptVersionRequest
    }) => promptApi.createPromptVersion(promptId, data),
    onSuccess: (_, { promptId }) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.versions(promptId) })
      queryClient.invalidateQueries({ queryKey: promptKeys.detail(promptId) })
    },
  })
}

export function useUpdateDraftVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      promptId,
      versionId,
      data,
    }: {
      promptId: number | string
      versionId: number | string
      data: UpdatePromptVersionRequest
    }) => promptApi.updateDraftVersion(promptId, versionId, data),
    onSuccess: (_, { promptId, versionId }) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.versions(promptId) })
      queryClient.invalidateQueries({ queryKey: promptKeys.version(promptId, versionId) })
    },
  })
}

export function useSubmitForReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ promptId, versionId }: { promptId: number | string; versionId: number | string }) =>
      promptApi.submitForReview(promptId, versionId),
    onSuccess: (_, { promptId, versionId }) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.versions(promptId) })
      queryClient.invalidateQueries({ queryKey: promptKeys.version(promptId, versionId) })
    },
  })
}

export function useApproveVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      promptId,
      versionId,
      data,
    }: {
      promptId: number | string
      versionId: number | string
      data?: ReviewPromptVersionRequest
    }) => promptApi.approveVersion(promptId, versionId, data),
    onSuccess: (_, { promptId, versionId }) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.versions(promptId) })
      queryClient.invalidateQueries({ queryKey: promptKeys.version(promptId, versionId) })
    },
  })
}

export function useRejectVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      promptId,
      versionId,
      data,
    }: {
      promptId: number | string
      versionId: number | string
      data: ReviewPromptVersionRequest
    }) => promptApi.rejectVersion(promptId, versionId, data),
    onSuccess: (_, { promptId, versionId }) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.versions(promptId) })
      queryClient.invalidateQueries({ queryKey: promptKeys.version(promptId, versionId) })
    },
  })
}

export function usePublishVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ promptId, versionId }: { promptId: number | string; versionId: number | string }) =>
      promptApi.publishVersion(promptId, versionId),
    onSuccess: (_, { promptId, versionId }) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() })
      queryClient.invalidateQueries({ queryKey: promptKeys.detail(promptId) })
      queryClient.invalidateQueries({ queryKey: promptKeys.versions(promptId) })
      queryClient.invalidateQueries({ queryKey: promptKeys.version(promptId, versionId) })
    },
  })
}

export function useRollbackToVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ promptId, data }: { promptId: number | string; data: RollbackPromptRequest }) =>
      promptApi.rollbackToVersion(promptId, data),
    onSuccess: (_, { promptId }) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() })
      queryClient.invalidateQueries({ queryKey: promptKeys.detail(promptId) })
      queryClient.invalidateQueries({ queryKey: promptKeys.versions(promptId) })
    },
  })
}

export function useReviewHistory(promptId?: string | number, versionId?: string | number) {
  return useQuery({
    queryKey: promptKeys.history(promptId ?? '', versionId ?? ''),
    queryFn: () => promptApi.getReviewHistory(promptId!, versionId!),
    enabled: !!promptId && !!versionId,
  })
}

export function usePromptDiff(
  promptId?: string | number,
  fromVersionId?: string | number,
  toVersionId?: string | number,
) {
  return useQuery({
    queryKey: promptKeys.diff(promptId ?? '', fromVersionId ?? '', toVersionId ?? ''),
    queryFn: () => promptApi.getPromptDiff(promptId!, fromVersionId!, toVersionId!),
    enabled: !!promptId && !!fromVersionId && !!toVersionId,
  })
}

export function useAiExecutionLogs(filters: AiExecutionLogFilters) {
  return useQuery({
    queryKey: promptKeys.logs(filters),
    queryFn: () => promptApi.getAiExecutionLogs(filters),
  })
}

export function useAiExecutionLog(logId?: string | number) {
  return useQuery({
    queryKey: promptKeys.logDetail(logId ?? ''),
    queryFn: () => promptApi.getAiExecutionLogById(logId!),
    enabled: !!logId,
  })
}
