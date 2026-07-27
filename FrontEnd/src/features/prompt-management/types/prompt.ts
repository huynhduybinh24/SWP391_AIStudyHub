export type PromptCategory = 'GENERATION' | 'ASSESSMENT' | 'CONVERSATION' | 'MODERATION' | 'SYSTEM'

export type PromptVersionStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED'

export type ChangeType = 'PATCH' | 'MINOR' | 'MAJOR'

export type ExecutionStatus = 'PROCESSING' | 'SUCCESS' | 'FAILED'

export type ReviewAction =
  | 'SUBMITTED_FOR_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ROLLBACK'

export interface PromptSummary {
  id: number
  code: string
  name: string
  description?: string
  category: PromptCategory
  active: boolean
  currentPublishedVersion?: string
  currentPublishedVersionId?: number
  createdByName?: string
  createdById?: number
  createdAt?: string
  updatedByName?: string
  updatedById?: number
  updatedAt?: string
  totalVersions?: number
}

export interface PromptVersionSummary {
  id: number
  promptId: number
  promptCode: string
  promptName: string
  version: string
  markdownContent: string
  status: PromptVersionStatus
  changeType: ChangeType
  changeSummary: string
  changeReason: string
  previousVersionId?: number
  previousVersionNumber?: string
  rollbackSourceVersionId?: number
  rollbackSourceVersionNumber?: string
  createdByName?: string
  createdById?: number
  createdAt?: string
  updatedByName?: string
  updatedById?: number
  updatedAt?: string
  reviewedByName?: string
  reviewedById?: number
  reviewedAt?: string
  reviewComment?: string
  publishedByName?: string
  publishedById?: number
  publishedAt?: string
}

export interface DiffLine {
  type: 'ADD' | 'DELETE' | 'UNCHANGED'
  oldLineNumber?: number
  newLineNumber?: number
  content: string
}

export interface PromptDiffResponse {
  fromVersionId: number
  fromVersionNumber: string
  toVersionId: number
  toVersionNumber: string
  promptCode: string
  promptName: string
  diffLines: DiffLine[]
  additionsCount: number
  deletionsCount: number
  unchangedCount: number
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
  llmProvider?: string
  llmModel?: string
  requestId?: string
  providerRequestId?: string
  status: ExecutionStatus
  errorMessage?: string
  startedAt?: string
  completedAt?: string
  latencyMs?: number
  tokenUsage?: number
  inputMetadata?: string
  outputReference?: string
  createdAt?: string
  publishedByName?: string
  publishedAt?: string
}

export interface PromptReviewHistorySummary {
  id: number
  promptVersionId: number
  action: ReviewAction
  comment?: string
  performedByName?: string
  performedById?: number
  performedAt: string
}

export interface CreatePromptRequest {
  code: string
  name: string
  description?: string
  category: PromptCategory
  initialMarkdownContent: string
  changeSummary?: string
  changeReason?: string
}

export interface UpdatePromptRequest {
  name: string
  description?: string
  category: PromptCategory
}

export interface CreatePromptVersionRequest {
  markdownContent: string
  changeType: ChangeType
  changeSummary: string
  changeReason: string
  basedOnVersionId?: number
}

export interface UpdatePromptVersionRequest {
  markdownContent: string
  changeSummary?: string
  changeReason?: string
}

export interface ReviewPromptVersionRequest {
  comment?: string
}

export interface RollbackPromptRequest {
  targetVersionId: number
  reason: string
  changeType: ChangeType
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
  page?: number
  size?: number
}

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}
