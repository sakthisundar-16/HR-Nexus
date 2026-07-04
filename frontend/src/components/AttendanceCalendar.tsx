import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AttendanceRecord } from '@/types'

interface AttendanceCalendarProps {
  records: AttendanceRecord[]
  month: string // YYYY-MM
  onMonthChange: (month: string) => void
}

const statusColors: Record<string, string> = {
  present:  'bg-sage text-white',
  late:     'bg-terracotta text-white',
  absent:   'bg-red-500 text-white',
  half_day: 'bg-olive text-white',
  on_leave: 'bg-olive/60 text-white',
}

const statusDot: Record<string, string> = {
  present:  'bg-sage',
  late:     'bg-terracotta',
  absent:   'bg-red-500',
  half_day: 'bg-olive',
  on_leave: 'bg-olive/60',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function AttendanceCalendar({ records, month, onMonthChange }: AttendanceCalendarProps) {
  const [year, mon] = month.split('-').map(Number)

  const recordMap = useMemo(() => {
    const map: Record<string, AttendanceRecord> = {}
    ;(records ?? []).forEach(r => { map[r.date] = r })
    return map
  }, [records])

  const firstDay = new Date(year, mon - 1, 1).getDay()
  const daysInMonth = new Date(year, mon, 0).getDate()

  const prevMonth = () => {
    const d = new Date(year, mon - 2, 1)
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const nextMonth = () => {
    const d = new Date(year, mon, 1)
    onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Summary
  const summary = useMemo(() => {
    const counts = { present: 0, late: 0, absent: 0, half_day: 0, on_leave: 0 }
    ;(records ?? []).forEach(r => { if (r.status in counts) counts[r.status as keyof typeof counts]++ })
    return counts
  }, [records])

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h3 className="font-bold text-[var(--text-primary)]">{MONTHS[mon - 1]} {year}</h3>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-bold text-[var(--text-muted)] py-1.5">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells */}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}

        {/* Days */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const record = recordMap[dateStr]
          const isToday = dateStr === todayStr
          const isWeekend = [0, 6].includes(new Date(year, mon - 1, day).getDay())

          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.05 }}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-semibold cursor-default
                ${isToday ? 'ring-2 ring-terracotta ring-offset-1' : ''}
                ${isWeekend && !record ? 'opacity-40' : ''}
                ${record ? statusColors[record.status] + ' shadow-sm' : 'hover:bg-[var(--surface)] text-[var(--text-secondary)]'}
              `}
              title={record ? `${record.status}${record.total_hours ? ` — ${record.total_hours.toFixed(1)}h` : ''}` : ''}
            >
              {day}
              {record && record.total_hours && (
                <span className="text-[9px] opacity-80 leading-none">{record.total_hours.toFixed(0)}h</span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Legend & summary */}
      <div className="mt-6 pt-5 border-t border-[var(--border)]">
        <div className="flex flex-wrap gap-3 justify-center">
          {Object.entries(statusDot).map(([status, dot]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className="capitalize">{status.replace('_', ' ')}</span>
              <span className="font-bold text-[var(--text-primary)]">({summary[status as keyof typeof summary] ?? 0})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
