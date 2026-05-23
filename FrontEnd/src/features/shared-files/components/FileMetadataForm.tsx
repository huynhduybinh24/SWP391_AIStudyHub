import { TagInput } from './TagInput'

interface FileMetadataFormProps {
  title: string
  onTitleChange: (val: string) => void
  subject: string
  onSubjectChange: (val: string) => void
  description: string
  onDescriptionChange: (val: string) => void
  tags: string[]
  onTagsChange: (tags: string[]) => void
  isProcessing?: boolean
}

const SUBJECT_OPTIONS = [
  { label: 'Biology', value: 'Biology' },
  { label: 'Chemistry', value: 'Chemistry' },
  { label: 'Physics', value: 'Physics' },
  { label: 'Mathematics', value: 'Mathematics' },
  { label: 'Computer Science', value: 'Computer Science' }
]

const RECOMMENDED_TAGS = ['Notes', 'Assignment', 'Lecture', 'Midterm', 'Final Exam']

export function FileMetadataForm({
  title,
  onTitleChange,
  subject,
  onSubjectChange,
  description,
  onDescriptionChange,
  tags,
  onTagsChange,
  isProcessing = false
}: FileMetadataFormProps) {
  return (
    <div className="space-y-5 text-left select-none">
      
      {/* 1. File Title */}
      <div className="space-y-2">
        <label htmlFor="form-title" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          File Title
        </label>
        <input
          id="form-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter file title"
          disabled={isProcessing}
          required
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#3155F6] focus:outline-none transition-colors px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
        />
      </div>

      {/* 2. Subject Select */}
      <div className="space-y-2">
        <label htmlFor="form-subject" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Subject
        </label>
        <div className="relative">
          <select
            id="form-subject"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            disabled={isProcessing}
            className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-55 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#3155F6] focus:outline-none transition-colors px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white cursor-pointer shadow-sm pr-10"
          >
            {SUBJECT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 dark:text-slate-500">
            <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Description Textarea */}
      <div className="space-y-2">
        <label htmlFor="form-desc" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Description
        </label>
        <textarea
          id="form-desc"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe this shared file..."
          disabled={isProcessing}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#3155F6] focus:outline-none transition-colors px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[100px] resize-none shadow-sm"
        />
      </div>

      {/* 4. Tags Multi-Tag Input */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Tags
        </label>
        <TagInput
          tags={tags}
          onChange={onTagsChange}
          availableTags={RECOMMENDED_TAGS}
        />
      </div>

    </div>
  )
}

export default FileMetadataForm
