import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BrainCircuit, Loader2 } from 'lucide-react'

import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Radio } from '@/components/ui/Radio'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// ─── Schema ──────────────────────────────────────────────

const studyPlanSchema = z
  .object({
    title:       z.string().min(1, 'Title is required'),
    subject:     z.string().min(1, 'Subject is required'),
    description: z.string().optional(),
    startDate:   z.string().min(1, 'Start date is required'),
    endDate:     z.string().min(1, 'End date is required'),
    priority:    z.enum(['Low', 'Medium', 'High']),
    schedule:    z.array(z.string()).min(1, 'Select at least one day'),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

type StudyPlanFormValues = z.infer<typeof studyPlanSchema>

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// AI suggestion templates per subject
const AI_SUGGESTIONS: Record<string, Partial<StudyPlanFormValues>> = {
  Mathematics:      { title: 'Mathematics Mastery Plan',      description: 'Structured approach to master calculus, algebra, and statistics from fundamentals to advanced topics.',      schedule: ['Mon', 'Wed', 'Fri'] },
  Physics:          { title: 'Physics Deep Dive',             description: 'Comprehensive study of mechanics, thermodynamics, electromagnetism, and modern physics.',                    schedule: ['Tue', 'Thu', 'Sat'] },
  'Computer Science': { title: 'CS & Algorithms Bootcamp',   description: 'From data structures to system design — crack technical interviews and build solid CS foundations.',          schedule: ['Mon', 'Tue', 'Thu', 'Fri'] },
  Literature:       { title: 'Literature Analysis Journey',   description: 'Explore classic and modern literature through close reading, critical analysis, and essay writing practice.', schedule: ['Wed', 'Sat', 'Sun'] },
  Chemistry:        { title: 'Chemistry Complete Guide',      description: 'Master organic and inorganic chemistry with lab practicals, reaction mechanisms, and exam preparation.',       schedule: ['Mon', 'Wed', 'Fri'] },
  Biology:          { title: 'Biology Systems Mastery',       description: 'Comprehensive coverage of cell biology, genetics, ecology, and human physiology with diagram practice.',       schedule: ['Tue', 'Thu', 'Sat'] },
}

// ─── Props ───────────────────────────────────────────────

interface CreateStudyPlanModalProps {
  isOpen:   boolean
  onClose:  () => void
}

// ─── Component ───────────────────────────────────────────

export const CreateStudyPlanModal = ({ isOpen, onClose }: CreateStudyPlanModalProps) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudyPlanFormValues>({
    resolver: zodResolver(studyPlanSchema),
    defaultValues: {
      title:       '',
      subject:     'Mathematics',
      description: '',
      startDate:   '',
      endDate:     '',
      priority:    'High',
      schedule:    [],
    },
  })

  // Reset form whenever the modal opens fresh
  useEffect(() => {
    if (isOpen) {
      reset({
        title: '', subject: 'Mathematics', description: '',
        startDate: '', endDate: '', priority: 'High', schedule: [],
      })
    }
  }, [isOpen, reset])

  const currentSubject = watch('subject')

  // ── Generate with AI ─────────────────────────────────
  const handleGenerateAI = async () => {
    setIsGenerating(true)
    // Simulate AI generation delay
    await new Promise((r) => setTimeout(r, 1200))

    const suggestion = AI_SUGGESTIONS[currentSubject] ?? AI_SUGGESTIONS['Mathematics']
    if (suggestion.title)       setValue('title', suggestion.title, { shouldValidate: true })
    if (suggestion.description) setValue('description', suggestion.description, { shouldValidate: true })
    if (suggestion.schedule)    setValue('schedule', suggestion.schedule, { shouldValidate: true })
    setValue('priority', 'High')

    // Set start date to today, end date to +30 days
    const today = new Date()
    const endDay = new Date(today)
    endDay.setDate(today.getDate() + 30)
    setValue('startDate', today.toISOString().split('T')[0], { shouldValidate: true })
    setValue('endDate',   endDay.toISOString().split('T')[0],  { shouldValidate: true })

    setIsGenerating(false)
  }

  // ── Submit ───────────────────────────────────────────
  const onSubmit = (data: StudyPlanFormValues) => {
    console.log('Create Study Plan:', data)
    // TODO: integrate with backend / global state
    reset()
    onClose()
  }

  // ── Save as Draft ────────────────────────────────────
  const handleSaveDraft = () => {
    const values = watch()
    console.log('Saved as draft:', values)
    // Persist to localStorage as demo
    localStorage.setItem('studyPlanDraft', JSON.stringify(values))
    onClose()
  }

  // ── Close handler (also resets) ──────────────────────
  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Study Plan"
      description="Organize your learning goals and track your progress."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Title ── */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Study Plan Title <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="e.g. Finals Week Preparation"
            {...register('title')}
            error={errors.title?.message}
          />
        </div>

        {/* ── Subject ── */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Subject <span className="text-red-500">*</span>
          </label>
          <Select {...register('subject')} error={errors.subject?.message}>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Literature">Literature</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
          </Select>
        </div>

        {/* ── Description ── */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Goal / Description</label>
          <Textarea
            placeholder="What do you want to achieve with this study plan?"
            {...register('description')}
            error={errors.description?.message}
          />
        </div>

        {/* ── Dates ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Start Date <span className="text-red-500">*</span>
            </label>
            <Input type="date" {...register('startDate')} error={errors.startDate?.message} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
              End Date <span className="text-red-500">*</span>
            </label>
            <Input type="date" {...register('endDate')} error={errors.endDate?.message} />
          </div>
        </div>

        {/* ── Priority ── */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Priority</label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <div className="flex items-center gap-6">
                {(['Low', 'Medium', 'High'] as const).map((level) => (
                  <Radio
                    key={level}
                    label={level}
                    value={level}
                    checked={field.value === level}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                ))}
              </div>
            )}
          />
          {errors.priority && <p className="text-sm text-red-500">{errors.priority.message}</p>}
        </div>

        {/* ── Study Schedule ── */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Study Schedule <span className="text-red-500">*</span>
          </label>
          <Controller
            control={control}
            name="schedule"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const isSelected = field.value.includes(day)
                  return (
                    <label
                      key={day}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 select-none',
                        isSelected
                          ? 'border-[#2557E8] bg-[#eef2ff] text-[#2557E8] dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:border-slate-700'
                      )}
                    >
                      <input
                        type="checkbox"
                        value={day}
                        className="sr-only"
                        checked={isSelected}
                        onChange={(e) => {
                          field.onChange(
                            e.target.checked
                              ? [...field.value, day]
                              : field.value.filter((v: string) => v !== day)
                          )
                        }}
                      />
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border transition-colors shrink-0',
                          isSelected ? 'border-[#2557E8] bg-[#2557E8] text-white dark:border-blue-600 dark:bg-blue-600' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
                        )}
                      >
                        {isSelected && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      {day}
                    </label>
                  )
                })}
              </div>
            )}
          />
          {errors.schedule && <p className="text-sm text-red-500">{errors.schedule.message}</p>}
        </div>

        {/* ── AI Suggestion Box ── */}
        <div className="flex items-start gap-4 rounded-xl bg-[#eef2ff] dark:bg-blue-950/20 border border-[#c7d2fe] dark:border-blue-900 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-[#2557E8] dark:text-blue-400 shadow-sm">
            {isGenerating
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : <BrainCircuit className="h-5 w-5" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[#2557E8] dark:text-blue-400">AI Study Suggestion</h4>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
              {isGenerating
                ? `Generating a smart plan for ${currentSubject}...`
                : 'Let AI help you create a smart study schedule based on your deadline and subject.'}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="shrink-0 mt-1 bg-[#2557E8] hover:bg-[#1d4ed8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
            onClick={handleGenerateAI}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </Button>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={handleSaveDraft}>
            Save as Draft
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="bg-[#2557E8] hover:bg-[#1d4ed8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
            disabled={isSubmitting}
          >
            Create Study Plan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
