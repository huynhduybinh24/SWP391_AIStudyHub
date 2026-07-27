export type PromptCategory = 'ACADEMIC' | 'EVALUATION' | 'GENERATION' | 'CHAT' | 'MODERATION'

export type PromptVersionStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'ARCHIVED'

export type ChangeType = 'MINOR' | 'MAJOR' | 'HOTFIX'

export type ExecutionStatus = 'PROCESSING' | 'SUCCESS' | 'FAILED'

export interface Prompt {
  id: number
  code: string
  name: string
  description?: string
  category: PromptCategory
  active: boolean
  createdAt: string
  updatedAt: string
}

export type PromptSummary = Prompt

export interface PromptVersion {
  id: number
  promptId: number
  version: string
  markdownContent: string
  status: PromptVersionStatus
  changeType: ChangeType
  changeSummary: string
  changeReason?: string
  createdByUserId?: number
  createdByName?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export type PromptVersionSummary = PromptVersion

export interface PromptDiffResponse {
  fromVersion: string
  toVersion: string
  diffHtml?: string
  markdownDiff?: string
}

export interface PromptReviewHistorySummary {
  id: number
  versionId: number
  action: string
  comment?: string
  reviewedBy?: string
  reviewedAt: string
}

export interface AiExecutionLogSummary {
  id: number
  userId?: number
  userName?: string
  studentCode?: string
  featureType: string
  promptId?: number
  promptCode: string
  promptVersionId?: number
  promptVersion: string
  knowledgeBaseId?: string
  knowledgeVersion?: string
  llmProvider: string
  llmModel: string
  requestId: string
  providerRequestId?: string
  status: ExecutionStatus
  errorMessage?: string
  startedAt: string
  completedAt?: string
  latencyMs?: number
  tokenUsage?: number
  inputMetadata?: string
  outputReference?: string
  createdAt: string
  publishedByName?: string
  publishedAt?: string
  flagged?: boolean
  reportReason?: string
  reportedAt?: string
}

export interface AiExecutionLogFilters {
  studentCode?: string
  featureType?: string
  promptCode?: string
  promptVersion?: string
  knowledgeVersion?: string
  llmModel?: string
  status?: ExecutionStatus
  fromDate?: string
  toDate?: string
  flaggedOnly?: boolean
  page?: number
  size?: number
}

export interface CreatePromptRequest {
  code: string
  name: string
  description?: string
  category: PromptCategory
  initialContent: string
}

export interface UpdatePromptRequest {
  name: string
  description?: string
  category: PromptCategory
  active?: boolean
}

export interface CreatePromptVersionRequest {
  markdownContent: string
  changeType: ChangeType
  changeSummary: string
  changeReason?: string
}

export interface UpdatePromptVersionRequest {
  markdownContent: string
  changeType?: ChangeType
  changeSummary?: string
  changeReason?: string
}

export interface ReviewPromptVersionRequest {
  comment?: string
}

export interface RollbackPromptRequest {
  targetVersionId: number
  reason: string
}

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}
