import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BrainCircuit } from 'lucide-react'

import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Radio } from '@/components/ui/Radio'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const studyPlanSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  priority: z.enum(['Low', 'Medium', 'High']),
  schedule: z.array(z.string()).min(1, 'Select at least one day'),
})

type StudyPlanFormValues = z.infer<typeof studyPlanSchema>

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface CreateStudyPlanModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateStudyPlanModal = ({ isOpen, onClose }: CreateStudyPlanModalProps) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<StudyPlanFormValues>({
    resolver: zodResolver(studyPlanSchema),
    defaultValues: {
      title: '',
      subject: 'Mathematics',
      description: '',
      startDate: '',
      endDate: '',
      priority: 'High',
      schedule: [],
    },
  })

  const onSubmit = (data: StudyPlanFormValues) => {
    console.log('Form data:', data)
    // Handle form submission logic here
    onClose()
  }

  const selectedSchedule = watch('schedule')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Study Plan"
      description="Organize your learning goals and track your progress."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Study Plan Title</label>
          <Input placeholder="e.g. Finals Week Preparation" {...register('title')} error={errors.title?.message} />
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Subject</label>
          <Select {...register('subject')} error={errors.subject?.message}>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Literature">Literature</option>
          </Select>
        </div>

        {/* Goal / Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Goal / Description</label>
          <Textarea placeholder="What do you want to achieve?" {...register('description')} error={errors.description?.message} />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Start Date</label>
            <Input type="date" {...register('startDate')} error={errors.startDate?.message} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">End Date</label>
            <Input type="date" {...register('endDate')} error={errors.endDate?.message} />
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Priority</label>
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
          {errors.priority && <p className="text-sm text-danger">{errors.priority.message}</p>}
        </div>

        {/* Study Schedule */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Study Schedule</label>
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
                        'flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-white text-body hover:bg-surface'
                      )}
                    >
                      <input
                        type="checkbox"
                        value={day}
                        className="peer sr-only"
                        checked={isSelected}
                        onChange={(e) => {
                          const checked = e.target.checked
                          field.onChange(
                            checked
                              ? [...field.value, day]
                              : field.value.filter((v: string) => v !== day)
                          )
                        }}
                      />
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                          isSelected ? 'border-primary bg-primary text-white' : 'border-border bg-white'
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
          {errors.schedule && <p className="text-sm text-danger">{errors.schedule.message}</p>}
        </div>

        {/* AI Suggestion Box */}
        <div className="flex items-start gap-4 rounded-xl bg-icon-bg/50 p-4 border border-icon-bg">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-primary">AI Study Suggestion</h4>
            <p className="mt-1 text-sm text-body">
              Let AI help you create a smart study schedule based on your deadline and subject.
            </p>
          </div>
          <Button type="button" variant="primary" size="sm" className="shrink-0 mt-1">
            Generate with AI
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="secondary">
            Save as Draft
          </Button>
          <Button type="submit" variant="primary">
            Create Study Plan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
