import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, LogOut, Clock, Loader2, Users } from 'lucide-react'
import { AttendanceCalendar } from '@/components/AttendanceCalendar'
import { StatusBadge } from '@/components/StatusBadge'
import { useAuth } from '@/hooks/useAuth'
import { attendanceApi } from '@/api/attendance'
import type { AttendanceRecord, AttendanceSummary } from '@/types'
import { globalToast } from '@/layouts/AuthLayout'

export default function Attendance() {
  const { role } = useAuth()
  const isAdmin = role === 'admin' || role === 'hr_manager'
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    try {
      const [recs, sum, today] = await Promise.all([
        attendanceApi.getMyAttendance(month),
        attendanceApi.getMySummary(month),
        attendanceApi.getTodayStatus(),
      ])
      setRecords(recs)
      setSummary(sum)
      setTodayRecord(today)
    } catch { /* silent */ }
  }

  useEffect(() => {
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [month])

  const handleCheckIn = async () => {
    setActionLoading(true)
    try {
      const rec = await attendanceApi.checkIn()
      setTodayRecord(rec)
      globalToast('Checked in successfully!', 'success')
      await loadData()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      globalToast(msg ?? 'Check-in failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    try {
      const rec = await attendanceApi.checkOut()
      setTodayRecord(rec)
      globalToast(`Checked out. ${rec.total_hours?.toFixed(1)}h worked today.`, 'success')
      await loadData()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      globalToast(msg ?? 'Check-out failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const hasCheckedIn = !!todayRecord?.check_in
  const hasCheckedOut = !!todayRecord?.check_out

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Attendance</h1>
        {todayRecord && <StatusBadge status={todayRecord.status} className="text-sm" />}
      </div>

      {/* Check-in / Check-out */}
      {!isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <h2 className="font-bold text-[var(--text-primary)] mb-4">Today — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Check-in', value: todayRecord?.check_in ? new Date(todayRecord.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' },
              { label: 'Check-out', value: todayRecord?.check_out ? new Date(todayRecord.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' },
              { label: 'Hours Worked', value: todayRecord?.total_hours ? `${todayRecord.total_hours.toFixed(1)}h` : '—' },
              { label: 'Status', value: todayRecord ? <StatusBadge status={todayRecord.status} /> : '—' },
            ].map(item => (
              <div key={item.label} className="text-center p-3 rounded-xl bg-[var(--surface)]">
                <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">{item.label}</p>
                <div className="font-bold text-[var(--text-primary)]">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCheckIn}
              disabled={hasCheckedIn || actionLoading}
              id="check-in-btn"
              className="btn-sage flex-1"
            >
              {actionLoading && !hasCheckedIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {hasCheckedIn ? 'Already Checked In' : 'Check In'}
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!hasCheckedIn || hasCheckedOut || actionLoading}
              id="check-out-btn"
              className="btn-nexus flex-1"
            >
              {actionLoading && hasCheckedIn && !hasCheckedOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              {hasCheckedOut ? 'Already Checked Out' : 'Check Out'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Present', value: summary.days_present, color: 'text-sage-500' },
            { label: 'Absent', value: summary.days_absent, color: 'text-red-500' },
            { label: 'Late', value: summary.days_late, color: 'text-terracotta-400' },
            { label: 'On Leave', value: summary.days_on_leave, color: 'text-olive' },
            { label: 'Avg Hours', value: summary.average_working_hours.toFixed(1), color: 'text-[var(--text-primary)]' },
          ].map(s => (
            <div key={s.label} className="glass p-4 rounded-2xl text-center">
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar */}
      <AttendanceCalendar records={records} month={month} onMonthChange={setMonth} />
    </div>
  )
}
