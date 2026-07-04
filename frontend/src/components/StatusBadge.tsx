import React from 'react'

type BadgeStatus =
  | 'active' | 'on_leave' | 'terminated' | 'probation'
  | 'present' | 'absent' | 'late' | 'half_day' | 'on_leave'
  | 'pending' | 'approved' | 'rejected' | 'cancelled'
  | 'draft' | 'processed' | 'paid'

interface StatusBadgeProps {
  status: string
  className?: string
}

const badgeConfig: Record<string, { label: string; classes: string }> = {
  // Employment
  active:     { label: 'Active',      classes: 'bg-sage/20 text-sage-500 border-sage/30' },
  on_leave:   { label: 'On Leave',    classes: 'bg-terracotta/20 text-terracotta-400 border-terracotta/30' },
  terminated: { label: 'Terminated',  classes: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
  probation:  { label: 'Probation',   classes: 'bg-olive/20 text-olive border-olive/30' },
  // Attendance
  present:    { label: 'Present',     classes: 'bg-sage/20 text-sage-500 border-sage/30' },
  absent:     { label: 'Absent',      classes: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400' },
  late:       { label: 'Late',        classes: 'bg-terracotta/20 text-terracotta-400 border-terracotta/30' },
  half_day:   { label: 'Half Day',    classes: 'bg-cream border-olive/20 text-olive' },
  // Leave / Payroll
  pending:    { label: 'Pending',     classes: 'bg-olive/20 text-olive border-olive/30' },
  approved:   { label: 'Approved',    classes: 'bg-sage/20 text-sage-500 border-sage/30' },
  rejected:   { label: 'Rejected',    classes: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400' },
  cancelled:  { label: 'Cancelled',   classes: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400' },
  // Payroll
  draft:      { label: 'Draft',       classes: 'bg-cream border-olive/20 text-olive' },
  processed:  { label: 'Processed',   classes: 'bg-terracotta/20 text-terracotta-400 border-terracotta/30' },
  paid:       { label: 'Paid',        classes: 'bg-sage/20 text-sage-500 border-sage/30' },
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalized = status ? status.toLowerCase() : ''
  const cfg = badgeConfig[normalized] ?? {
    label: status ?? 'Unknown',
    classes: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.classes} ${className}`}
    >
      {cfg.label}
    </span>
  )
}
