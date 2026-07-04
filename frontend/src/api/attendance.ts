import apiClient, { unwrap } from './client'
import type { AttendanceRecord, AttendanceSummary } from '@/types'

export const attendanceApi = {
  async checkIn(notes?: string): Promise<AttendanceRecord> {
    const res = await apiClient.post('/attendance/check-in', { notes: notes ?? null })
    return unwrap<AttendanceRecord>(res)
  },

  async checkOut(notes?: string): Promise<AttendanceRecord> {
    const res = await apiClient.post('/attendance/check-out', { notes: notes ?? null })
    return unwrap<AttendanceRecord>(res)
  },

  async getMyAttendance(month?: string): Promise<AttendanceRecord[]> {
    const params: Record<string, string | number> = { per_page: 100 }
    if (month) {
      const [year, m] = month.split('-')
      params.start_date = `${year}-${m}-01`
      const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate()
      params.end_date = `${year}-${m}-${String(lastDay).padStart(2, '0')}`
    }
    const res = await apiClient.get('/attendance/history', { params })
    const data = unwrap<{ items: AttendanceRecord[]; total: number }>(res)
    return data.items
  },

  async getEmployeeAttendance(employeeId: string, month?: string): Promise<AttendanceRecord[]> {
    const params: Record<string, string | number> = { per_page: 100 }
    if (month) {
      const [year, m] = month.split('-')
      params.start_date = `${year}-${m}-01`
      const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate()
      params.end_date = `${year}-${m}-${String(lastDay).padStart(2, '0')}`
    }
    const res = await apiClient.get(`/attendance/employee/${employeeId}`, { params })
    const data = unwrap<{ items: AttendanceRecord[]; total: number }>(res)
    return data.items
  },

  async getMySummary(month?: string): Promise<AttendanceSummary> {
    const params: Record<string, number> = {}
    if (month) {
      const [year, m] = month.split('-')
      params.year = parseInt(year)
      params.month = parseInt(m)
    }
    const res = await apiClient.get('/attendance/summary', { params })
    return unwrap<AttendanceSummary>(res)
  },

  async getTodayStatus(): Promise<AttendanceRecord | null> {
    try {
      const res = await apiClient.get('/attendance/today')
      return unwrap<AttendanceRecord>(res)
    } catch {
      return null
    }
  },
}
