import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  GitCompare,
  Send,
  CheckCircle,
  XCircle,
  Rocket,
  RotateCcw,
  Clock,
  User,
  History,
  AlertTriangle,
  Lock,
  Edit3,
} from 'lucide-react'
import {
  usePrompt,
  usePromptVersion,
  useUpdateDraftVersion,
  useSubmitForReview,
  useApproveVersion,
  useRejectVersion,
  usePublishVersion,
  useRollbackToVersion,
  useReviewHistory,
} from '../hooks/usePrompts'
import { PromptVersionStatusBadge } from '../components/PromptStatusBadge'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { ReviewModal } from '../components/ReviewModal'
import { PublishModal } from '../components/PublishModal'
import { RollbackModal } from '../components/RollbackModal'
import type { ChangeType } from '../types/prompt'
import { useToast } from '@/components/ui/Toast'

export function PromptVersionDetailPage() {
  const { promptId, versionId } = useParams<{ promptId: string; versionId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: prompt } = usePrompt(promptId)
  const { data: version, isLoading, isError, error } = usePromptVersion(promptId, versionId)
  const { data: historyLogs = [] } = useReviewHistory(promptId, versionId)

  // Mutations
  const updateDraftMutation = useUpdateDraftVersion()
  const submitReviewMutation = useSubmitForReview()
  const approveMutation = useApproveVersion()
  const rejectMutation = useRejectVersion()
  const publishMutation = usePublishVersion()
  const rollbackMutation = useRollbackToVersion()

  // Local State for Draft Editor
  const [markdownContent, setMarkdownContent] = useState('')
  const [changeSummary, setChangeSummary] = useState('')
  const [changeReason, setChangeReason] = useState('')

  // Modals state
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean
    type: 'submit' | 'approve' | 'reject'
  }>({ isOpen: false, type: 'submit' })

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false)

  useEffect(() => {
    if (version) {
      setMarkdownContent(version.markdownContent)
      setChangeSummary(version.changeSummary || '')
      setChangeReason(version.changeReason || '')
    }
  }, [version])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading version details...</p>
      </div>
    )
  }

  if (isError || !version) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 p-6 rounded-2xl border border-rose-200 dark:border-rose-800 text-center space-y-3 text-rose-700 dark:text-rose-300">
        <p className="text-sm font-semibold">Prompt Version Not Found</p>
        <p className="text-xs">{(error as Error)?.message}</p>
        <Link
          to={`/dashboard/admin/prompts/${promptId}`}
          className="inline-flex items-center gap-1 px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Prompt</span>
        </Link>
      </div>
    )
  }

  const isDraft = version.status === 'DRAFT'
  const isInReview = version.status === 'IN_REVIEW'
  const isApproved = version.status === 'APPROVED'
  const isPublished = version.status === 'PUBLISHED'
  const isArchived = version.status === 'ARCHIVED'
  const isRejected = version.status === 'REJECTED'

  // Actions
  const handleSaveDraft = async () => {
    try {
      await updateDraftMutation.mutateAsync({
        promptId: promptId!,
        versionId: versionId!,
        data: {
          markdownContent,
          changeSummary,
          changeReason,
        },
      })
      toast.success('Draft version saved successfully.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save draft.')
    }
  }

  const handleReviewAction = async (comment?: string) => {
    try {
      if (reviewModal.type === 'submit') {
        await submitReviewMutation.mutateAsync({ promptId: promptId!, versionId: versionId! })
        toast.success('Version submitted for review!')
      } else if (reviewModal.type === 'approve') {
        await approveMutation.mutateAsync({
          promptId: promptId!,
          versionId: versionId!,
          data: { comment },
        })
        toast.success('Version approved successfully!')
      } else if (reviewModal.type === 'reject') {
        await rejectMutation.mutateAsync({
          promptId: promptId!,
          versionId: versionId!,
          data: { comment: comment! },
        })
        toast.success('Version rejected!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Workflow action failed.')
      throw err
    }
  }

  const handlePublishConfirm = async () => {
    try {
      await publishMutation.mutateAsync({ promptId: promptId!, versionId: versionId! })
      toast.success(`Version ${version.version} published to production!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish version.')
    }
  }

  const handleRollbackConfirm = async (reason: string, changeType: ChangeType) => {
    try {
      const rollbackVersion = await rollbackMutation.mutateAsync({
        promptId: promptId!,
        data: {
          targetVersionId: version.id,
          reason,
          changeType,
        },
      })
      toast.success(`Rollback draft version ${rollbackVersion.version} created!`)
      navigate(`/dashboard/admin/prompts/${promptId}/versions/${rollbackVersion.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Rollback failed.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button & top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to={`/dashboard/admin/prompts/${promptId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {version.promptName || 'Prompt Detail'}</span>
        </Link>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {version.previousVersionId && (
            <Link
              to={`/dashboard/admin/prompts/${promptId}/diff?fromVersionId=${version.previousVersionId}&toVersionId=${version.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            >
              <GitCompare className="w-3.5 h-3.5 text-blue-500" />
              <span>Compare with Previous</span>
            </Link>
          )}

          {isDraft && (
            <button
              type="button"
              onClick={() => setReviewModal({ isOpen: true, type: 'submit' })}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Review</span>
            </button>
          )}

          {isInReview && (
            <>
              <button
                type="button"
                onClick={() => setReviewModal({ isOpen: true, type: 'approve' })}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                type="button"
                onClick={() => setReviewModal({ isOpen: true, type: 'reject' })}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          )}

          {isApproved && (
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Publish to Production</span>
            </button>
          )}

          {(isPublished || isArchived) && (
            <button
              type="button"
              onClick={() => setIsRollbackModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Create Rollback Draft</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Metadata Overview */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Version</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{version.version}</span>
              </h1>
              <PromptVersionStatusBadge status={version.status} />
            </div>
            <p className="text-xs text-slate-500">
              Prompt: <strong className="text-slate-700 dark:text-slate-300">{version.promptName}</strong> ({version.promptCode})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Change Type:</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {version.changeType}
            </span>
          </div>
        </div>

        {/* Change details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px] font-semibold">Change Summary</span>
            <p className="text-slate-800 dark:text-slate-200 font-medium">{version.changeSummary}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px] font-semibold">Change Reason</span>
            <p className="text-slate-800 dark:text-slate-200 font-medium">{version.changeReason}</p>
          </div>
        </div>

        {/* Rejection comment banner if rejected */}
        {isRejected && version.reviewComment && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-1 text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-1.5 font-bold">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Rejection Feedback from {version.reviewedByName || 'Reviewer'}:</span>
            </div>
            <p className="pl-5 italic">{version.reviewComment}</p>
          </div>
        )}

        {/* Timeline audit info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Created By:</span>
            <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{version.createdByName || 'SYSTEM'}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {version.createdAt ? new Date(version.createdAt).toLocaleString() : '-'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Reviewed By:</span>
            <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{version.reviewedByName || 'Pending / N/A'}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {version.reviewedAt ? new Date(version.reviewedAt).toLocaleString() : '-'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">Published By:</span>
            <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{version.publishedByName || 'Not Published'}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {version.publishedAt ? new Date(version.publishedAt).toLocaleString() : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Editor & Content Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Markdown Template Source
        </h2>
        <MarkdownEditor
          value={markdownContent}
          onChange={setMarkdownContent}
          readOnly={!isDraft}
          onSaveDraft={isDraft ? handleSaveDraft : undefined}
          onSubmitReview={isDraft ? () => setReviewModal({ isOpen: true, type: 'submit' }) : undefined}
          isSaving={updateDraftMutation.isPending}
          isSubmitting={submitReviewMutation.isPending}
        />
      </div>

      {/* Review History Logs Section */}
      {historyLogs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Workflow Audit History
            </h3>
          </div>

          <div className="space-y-3">
            {historyLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(log.performedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    By: <strong className="text-slate-700 dark:text-slate-300">{log.performedByName || 'SYSTEM'}</strong>
                  </p>
                  {log.comment && (
                    <p className="text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                      "{log.comment}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow Modals */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal((prev) => ({ ...prev, isOpen: false }))}
        type={reviewModal.type}
        versionNumber={version.version}
        onSubmit={handleReviewAction}
        isLoading={
          submitReviewMutation.isPending ||
          approveMutation.isPending ||
          rejectMutation.isPending
        }
      />

      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        promptCode={version.promptCode}
        newVersionNumber={version.version}
        currentPublishedVersionNumber={prompt?.currentPublishedVersion}
        onConfirm={handlePublishConfirm}
        isLoading={publishMutation.isPending}
      />

      <RollbackModal
        isOpen={isRollbackModalOpen}
        onClose={() => setIsRollbackModalOpen(false)}
        promptCode={version.promptCode}
        targetVersionId={version.id}
        targetVersionNumber={version.version}
        currentPublishedVersionNumber={prompt?.currentPublishedVersion}
        onConfirm={handleRollbackConfirm}
        isLoading={rollbackMutation.isPending}
      />
    </div>
  )
}
