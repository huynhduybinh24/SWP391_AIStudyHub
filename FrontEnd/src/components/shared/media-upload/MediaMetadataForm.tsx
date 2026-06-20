import { useState, useEffect } from 'react';
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

const MAJOR_SUBJECTS: Record<'SE' | 'AI' | 'BA', { value: string; label: string }[]> = {
  SE: [
    { value: 'PRF192', label: 'PRF192 - Programming Fundamentals' },
    { value: 'MAE101', label: 'MAE101 - Mathematics for Engineering' },
    { value: 'CEA201', label: 'CEA201 - Computer Organization' },
    { value: 'CSI104', label: 'CSI104 - Introduction to Computer Science' },
    { value: 'PRO192', label: 'PRO192 - Object-Oriented Programming' },
    { value: 'MAD101', label: 'MAD101 - Discrete Mathematics' },
    { value: 'OSG202', label: 'OSG202 - Operating Systems' },
    { value: 'SSG104', label: 'SSG104 - Communication Skills' },
    { value: 'CSD201', label: 'CSD201 - Data Structures and Algorithms' },
    { value: 'DBI202', label: 'DBI202 - Database Systems' },
    { value: 'LAB211', label: 'LAB211 - OOP Java Lab' },
    { value: 'PRN211', label: 'PRN211 - Basic Cross-Platform (.NET)' },
    { value: 'SWE201', label: 'SWE201 - Software Engineering' },
    { value: 'JPD113', label: 'JPD113 - Japanese Language 1' },
    { value: 'MTH202', label: 'MTH202 - Probability and Statistics' },
    { value: 'SWP391', label: 'SWP391 - Software Project' },
    { value: 'SWD392', label: 'SWD392 - Software Architecture' },
    { value: 'SWT301', label: 'SWT301 - Software Testing' },
    { value: 'ENT301', label: 'ENT301 - Entrepreneurship' },
    { value: 'OJT202', label: 'OJT202 - On-the-Job Training' },
    { value: 'PRM392', label: 'PRM392 - Mobile Programming' },
    { value: 'PRN221', label: 'PRN221 - Advanced Cross-Platform (.NET)' },
    { value: 'WDP301', label: 'WDP301 - Web Development Project' },
    { value: 'SEP490', label: 'SEP490 - Capstone Project Prep' },
    { value: 'EXE101', label: 'EXE101 - Experiential Entrepreneurship 1' },
    { value: 'IAS301', label: 'IAS301 - Information Assurance' },
    { value: 'EXE201', label: 'EXE201 - Experiential Entrepreneurship 2' },
    { value: 'PMG201', label: 'PMG201 - Project Management' }
  ],
  AI: [
    { value: 'PRF192', label: 'PRF192 - Programming Fundamentals' },
    { value: 'MAE101', label: 'MAE101 - Mathematics for Engineering' },
    { value: 'CEA201', label: 'CEA201 - Computer Organization' },
    { value: 'CSI104', label: 'CSI104 - Introduction to Computer Science' },
    { value: 'PRO192', label: 'PRO192 - Object-Oriented Programming' },
    { value: 'MAD101', label: 'MAD101 - Discrete Mathematics' },
    { value: 'OSG202', label: 'OSG202 - Operating Systems' },
    { value: 'SSG104', label: 'SSG104 - Communication Skills' },
    { value: 'CSD201', label: 'CSD201 - Data Structures and Algorithms' },
    { value: 'DBI202', label: 'DBI202 - Database Systems' },
    { value: 'AIL302M', label: 'AIL302m - Machine Learning' },
    { value: 'JPD113', label: 'JPD113 - Japanese Language 1' },
    { value: 'AIP301', label: 'AIP301 - AI Project' },
    { value: 'MTH202', label: 'MTH202 - Probability and Statistics' },
    { value: 'SWP391', label: 'SWP391 - Software Project' },
    { value: 'DLN301', label: 'DLN301 - Deep Learning' },
    { value: 'ENT301', label: 'ENT301 - Entrepreneurship' },
    { value: 'OJT202', label: 'OJT202 - On-the-Job Training' },
    { value: 'PRM392', label: 'PRM392 - Mobile Programming' },
    { value: 'NLP301', label: 'NLP301 - Natural Language Processing' },
    { value: 'CVP301', label: 'CVP301 - Computer Vision Project' },
    { value: 'CAP490', label: 'CAP490 - Capstone Project Prep' },
    { value: 'EXE101', label: 'EXE101 - Experiential Entrepreneurship 1' },
    { value: 'BDA301', label: 'BDA301 - Big Data Analytics' },
    { value: 'EXE201', label: 'EXE201 - Experiential Entrepreneurship 2' },
    { value: 'PMG201', label: 'PMG201 - Project Management' }
  ],
  BA: [
    { value: 'MGT103', label: 'MGT103 - Introduction to Management' },
    { value: 'ECO111', label: 'ECO111 - Microeconomics' },
    { value: 'FMA101', label: 'FMA101 - Financial Mathematics' },
    { value: 'SSG104', label: 'SSG104 - Communication Skills' },
    { value: 'MKT101', label: 'MKT101 - Basic Marketing' },
    { value: 'ECO121', label: 'ECO121 - Macroeconomics' },
    { value: 'AMG111', label: 'AMG111 - Art Management' },
    { value: 'DBI202', label: 'DBI202 - Database Systems' },
    { value: 'ACC101', label: 'ACC101 - Principles of Accounting' },
    { value: 'FIN201', label: 'FIN201 - Corporate Finance' },
    { value: 'BUL201', label: 'BUL201 - Business Law' },
    { value: 'HRM201', label: 'HRM201 - Human Resource Management' },
    { value: 'OBH201', label: 'OBH201 - Organizational Behavior' },
    { value: 'MRF301', label: 'MRF301 - Marketing Research' },
    { value: 'BIS301', label: 'BIS301 - Business Information Systems' },
    { value: 'ENT301', label: 'ENT301 - Entrepreneurship' },
    { value: 'POM201', label: 'POM201 - Production Operations' },
    { value: 'OJT202', label: 'OJT202 - On-the-Job Training' },
    { value: 'IBM301', label: 'IBM301 - International Business' },
    { value: 'SCM301', label: 'SCM301 - Supply Chain Management' },
    { value: 'BRM301', label: 'BRM301 - Business Research' },
    { value: 'BAP490', label: 'BAP490 - Capstone Project Prep' },
    { value: 'EXE101', label: 'EXE101 - Experiential Entrepreneurship 1' },
    { value: 'SMA301', label: 'SMA301 - Strategic Management' },
    { value: 'EXE201', label: 'EXE201 - Experiential Entrepreneurship 2' },
    { value: 'EBU301', label: 'EBU301 - E-Business' }
  ]
};

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
  const [selectedMajor, setSelectedMajor] = useState<'SE' | 'AI' | 'BA'>('SE');

  useEffect(() => {
    if (subject) {
      const upperSubj = subject.toUpperCase();
      if (MAJOR_SUBJECTS.SE.some(s => s.value === upperSubj)) {
        setSelectedMajor('SE');
      } else if (MAJOR_SUBJECTS.AI.some(s => s.value === upperSubj)) {
        setSelectedMajor('AI');
      } else if (MAJOR_SUBJECTS.BA.some(s => s.value === upperSubj)) {
        setSelectedMajor('BA');
      }
    }
  }, [subject]);

  const handleMajorChange = (major: 'SE' | 'AI' | 'BA') => {
    setSelectedMajor(major);
    const subjects = MAJOR_SUBJECTS[major];
    if (subjects && subjects.length > 0) {
      const hasCurrentSubj = subjects.some(s => s.value === subject.toUpperCase());
      if (!hasCurrentSubj) {
        onSubjectChange(subjects[0].value);
      }
    }
  };

  const currentSubjects = MAJOR_SUBJECTS[selectedMajor] || [];
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

      {/* 1.5 Major Selection */}
      <div className="space-y-2">
        <label htmlFor="media-form-major" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Ngành học
        </label>
        <div className="relative">
          <select
            id="media-form-major"
            value={selectedMajor}
            onChange={(e) => handleMajorChange(e.target.value as any)}
            disabled={isProcessing}
            className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-55 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#3155F6] focus:outline-none transition-colors px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white cursor-pointer shadow-sm pr-10"
          >
            <option value="SE">Kỹ thuật phần mềm (SE)</option>
            <option value="AI">Trí tuệ nhân tạo (AI)</option>
            <option value="BA">Quản trị kinh doanh (BA)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 dark:text-slate-500">
            <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
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
            {currentSubjects.map((opt) => (
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
