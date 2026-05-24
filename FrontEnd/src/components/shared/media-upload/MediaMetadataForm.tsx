import React from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import TagInput from '@/features/shared-files/components/TagInput';

interface MediaMetadataFormProps {
  title: string;
  onTitleChange: (val: string) => void;
  subject: string;
  onSubjectChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  showPermission?: boolean;
  permission?: 'viewer' | 'commenter' | 'editor';
  onPermissionChange?: (val: 'viewer' | 'commenter' | 'editor') => void;
  mediaType?: string;
  isProcessing?: boolean;
  titleLabel: string;
  subjectLabel: string;
  descriptionLabel: string;
  tagsLabel: string;
  permissionLabel?: string;
}

export function MediaMetadataForm({
  title,
  onTitleChange,
  subject,
  onSubjectChange,
  description,
  onDescriptionChange,
  tags,
  onTagsChange,
  showPermission = false,
  permission = 'viewer',
  onPermissionChange,
  mediaType,
  isProcessing = false,
  titleLabel,
  subjectLabel,
  descriptionLabel,
  tagsLabel,
  permissionLabel = 'Permissions'
}: MediaMetadataFormProps) {
  const SUBJECTS = [
    { value: 'BIOLOGY', label: 'Biology / Molecular Biology' },
    { value: 'COMPSCI', label: 'Computer Science / Software Engineering' },
    { value: 'MATHEMATICS', label: 'Mathematics / Calculus II' },
    { value: 'PHYSICS', label: 'Physics' },
    { value: 'PHILOSOPHY', label: 'Philosophy' },
    { value: 'ECONOMICS', label: 'Economics' },
    { value: 'GENERAL', label: 'General Studies' }
  ];

  const RECOMMENDED_TAGS = ['Notes', 'Assignment', 'Lecture', 'Midterm', 'Final Exam'];

  return (
    <div className="space-y-5 text-left select-none animate-fade-in">
      {/* 0. Type Read-only (if mediaType is specified) */}
      {mediaType && mediaType !== 'document' && (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#5F6E80] dark:text-slate-400 select-none">
            Type
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-[#EAF1FB] dark:border-slate-800 bg-[#F0F4F9]/60 dark:bg-slate-800/40 px-4 py-3 text-sm text-[#0B1A30] dark:text-slate-200 font-semibold select-none capitalize">
            <span>{mediaType === 'recording' ? 'Recording' : mediaType}</span>
          </div>
        </div>
      )}

      {/* 1. Title */}
      <div className="space-y-2">
        <label htmlFor="media-form-title" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {titleLabel}
        </label>
        <input
          id="media-form-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter title"
          disabled={isProcessing}
          required
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-55 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#3155F6] focus:outline-none transition-colors px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
        />
      </div>

      {/* 2. Subject Select */}
      <div className="space-y-2">
        <label htmlFor="media-form-subject" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {subjectLabel}
        </label>
        <div className="relative">
          <select
            id="media-form-subject"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            disabled={isProcessing}
            className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-55 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#3155F6] focus:outline-none transition-colors px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white cursor-pointer shadow-sm pr-10"
          >
            {SUBJECTS.map((opt) => (
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

      {/* 3. Description */}
      <div className="space-y-2">
        <label htmlFor="media-form-desc" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {descriptionLabel}
        </label>
        <textarea
          id="media-form-desc"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe this study asset..."
          disabled={isProcessing}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#3155F6] focus:outline-none transition-colors px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 min-h-[100px] resize-none shadow-sm"
        />
      </div>

      {/* 4. Tags Multi-Tag Input */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {tagsLabel}
        </label>
        <TagInput
          tags={tags}
          onChange={onTagsChange}
          availableTags={RECOMMENDED_TAGS}
        />
      </div>

      {/* 5. Permission Selection (Viewer, Commenter, Editor) - ONLY if showPermission is true */}
      {showPermission && onPermissionChange && (
        <div className="space-y-2">
          <label htmlFor="media-form-permission" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {permissionLabel}
          </label>
          <div className="relative">
            <select
              id="media-form-permission"
              value={permission}
              onChange={(e) => onPermissionChange(e.target.value as any)}
              disabled={isProcessing}
              className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-55 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#3155F6] focus:outline-none transition-colors px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white cursor-pointer shadow-sm pr-10"
            >
              <option value="viewer">Viewer</option>
              <option value="commenter">Commenter</option>
              <option value="editor">Editor</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 dark:text-slate-500">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaMetadataForm;
