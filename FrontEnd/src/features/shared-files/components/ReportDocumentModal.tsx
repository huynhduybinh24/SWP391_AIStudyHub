import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Link as LinkIcon, FileText } from 'lucide-react'
import { SharedFile } from './SharedFilesTable'
import { ReportReason } from '../services/reportService'
import { useTranslation } from '@/context/LanguageContext'

interface ReportDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: ReportReason, description: string, evidenceLink: string) => void
  file: SharedFile | null
}

const reasons: { value: ReportReason; label: string }[] = [
  { value: 'Plagiarism', label: 'Plagiarism' },
  { value: 'Copyright violation', label: 'Copyright violation' },
  { value: 'Inappropriate content', label: 'Inappropriate content' },
  { value: 'Misleading information', label: 'Misleading information' },
  { value: 'Other', label: 'Other' },
]

export default function ReportDocumentModal({ isOpen, onClose, onSubmit, file }: ReportDocumentModalProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState<ReportReason>('Plagiarism')
  const [description, setDescription] = useState('')
  const [evidenceLink, setEvidenceLink] = useState('')
  const [error, setError] = useState('')
  const [linkError, setLinkError] = useState('')

  if (!isOpen || !file) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLinkError('')

    if (description.trim().length < 10) {
      setError(t.sharedFiles.pleaseProvideTenCharacters || 'Please provide at least 10 characters.')
      return
    }

    if (evidenceLink.trim() !== '') {
      if (!evidenceLink.startsWith('http://') && !evidenceLink.startsWith('https://')) {
        setLinkError(t.sharedFiles.pleaseEnterValidLink || 'Please enter a valid link.')
        return
      }
    }

    onSubmit(reason, description.trim(), evidenceLink.trim())
    
    // Reset form after submit
    setReason('Plagiarism')
    setDescription('')
    setEvidenceLink('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.sharedFiles.reportDocumentTitle || 'Report Document'}</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {t.sharedFiles.reportDocumentSubtitle || 'Tell us why you think this document should be reviewed.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-start gap-3">
              <FileText className="size-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{file.name}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {t.sharedFiles.sharedBy || 'Shared by'} <span className="font-bold">{file.owner}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.sharedFiles.reason || 'Reason'}</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-shadow appearance-none"
              >
                {reasons.map((r) => {
                  let labelKey = ''
                  if (r.value === 'Plagiarism') labelKey = t.sharedFiles.reportReasonPlagiarism
                  else if (r.value === 'Copyright violation') labelKey = t.sharedFiles.reportReasonCopyrightViolation
                  else if (r.value === 'Inappropriate content') labelKey = t.sharedFiles.reportReasonInappropriateContent
                  else if (r.value === 'Misleading information') labelKey = t.sharedFiles.reportReasonMisleadingInformation
                  else if (r.value === 'Other') labelKey = t.sharedFiles.reportReasonOther

                  return (
                    <option key={r.value} value={r.value}>
                      {labelKey || r.label}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.sharedFiles.additionalDetails || 'Additional details'}</label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (error) setError('')
                }}
                placeholder={t.sharedFiles.describeIssuePlaceholder || 'Describe the issue you found...'}
                rows={4}
                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-shadow resize-none"
              />
              {error && <p className="text-xs font-bold text-red-500 mt-2">{error}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.sharedFiles.evidenceLinkOptional || 'Evidence link (optional)'}</label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  value={evidenceLink}
                  onChange={(e) => {
                    setEvidenceLink(e.target.value)
                    if (linkError) setLinkError('')
                  }}
                  placeholder={t.sharedFiles.pasteEvidencePlaceholder || 'Paste a source link or reference'}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-shadow"
                />
              </div>
              {linkError && <p className="text-xs font-bold text-red-500 mt-2">{linkError}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {t.common?.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-orange-600 hover:bg-orange-500 shadow-md shadow-orange-500/20 transition-all active:scale-[0.98]"
            >
              {t.sharedFiles.submitReport || 'Submit Report'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
