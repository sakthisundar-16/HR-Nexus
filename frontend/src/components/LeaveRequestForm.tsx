import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarDays, AlignLeft, Loader2 } from 'lucide-react'
import type { LeaveBalance } from '@/types'

const today = new Date().toISOString().split('T')[0]

const schema = z.object({
  leave_type: z.enum(['annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid']),
  start_date: z.string().refine(d => d >= today, { message: 'Start date cannot be in the past' }),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
}).refine(d => d.end_date >= d.start_date, {
  message: 'End date must be on or after start date',
  path: ['end_date'],
})

type FormData = z.infer<typeof schema>

interface LeaveRequestFormProps {
  balances: LeaveBalance[]
  onSubmit: (data: FormData) => Promise<void>
  isLoading?: boolean
}

const leaveTypeLabels: Record<string, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  personal: 'Personal Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  unpaid: 'Unpaid Leave',
}

export function LeaveRequestForm({ balances, onSubmit, isLoading }: LeaveRequestFormProps) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { leave_type: 'annual', start_date: today, end_date: today, reason: '' },
  })

  const startDate = watch('start_date')
  const endDate = watch('end_date')
  const leaveType = watch('leave_type')

  const duration = (() => {
    if (!startDate || !endDate || endDate < startDate) return 0
    const diff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    return Math.round(diff) + 1
  })()

  const selectedBalance = balances.find(b => b.leave_type.toLowerCase() === leaveType)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-5" noValidate>
      <h2 className="font-bold text-lg text-[var(--text-primary)]">Apply for Leave</h2>

      {/* Leave type */}
      <div>
        <label className="form-label" htmlFor="leave_type">Leave Type</label>
        <select id="leave_type" {...register('leave_type')} className="form-field">
          {Object.entries(leaveTypeLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        {selectedBalance && (
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Balance: <span className="font-bold text-sage-500">{selectedBalance.remaining_days} days</span> remaining
            {selectedBalance.pending_days > 0 && ` (${selectedBalance.pending_days} pending)`}
          </p>
        )}
        {errors.leave_type && <p className="form-error">{errors.leave_type.message}</p>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label flex items-center gap-1.5" htmlFor="start_date">
            <CalendarDays className="w-3.5 h-3.5 text-[var(--text-muted)]" />Start Date
          </label>
          <input id="start_date" type="date" {...register('start_date')} className="form-field" min={today} />
          {errors.start_date && <p className="form-error">{errors.start_date.message}</p>}
        </div>
        <div>
          <label className="form-label flex items-center gap-1.5" htmlFor="end_date">
            <CalendarDays className="w-3.5 h-3.5 text-[var(--text-muted)]" />End Date
          </label>
          <input id="end_date" type="date" {...register('end_date')} className="form-field" min={startDate || today} />
          {errors.end_date && <p className="form-error">{errors.end_date.message}</p>}
        </div>
      </div>

      {duration > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-terracotta/10 border border-terracotta/20">
          <CalendarDays className="w-4 h-4 text-terracotta" />
          <span className="text-sm font-semibold text-terracotta-400">
            {duration} day{duration !== 1 ? 's' : ''} requested
          </span>
        </div>
      )}

      {/* Reason */}
      <div>
        <label className="form-label flex items-center gap-1.5" htmlFor="reason">
          <AlignLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" />Reason
        </label>
        <textarea
          id="reason"
          {...register('reason')}
          rows={4}
          placeholder="Please provide a reason for your leave request (min. 10 characters)…"
          className="form-field resize-none"
        />
        {errors.reason && <p className="form-error">{errors.reason.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="btn-nexus w-full"
        id="submit-leave-btn"
      >
        {(isSubmitting || isLoading) ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
        ) : 'Submit Leave Request'}
      </button>
    </form>
  )
}
