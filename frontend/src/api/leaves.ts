import apiClient, { unwrap } from './client'
import type { LeaveRequest, LeaveBalance, LeaveReview } from '@/types'

interface CreateLeaveRequest {
  leave_type: string
  start_date: string
  end_date: string
  reason: string
}

export const leavesApi = {
  async getMyLeaves(): Promise<LeaveRequest[]> {
    const res = await apiClient.get('/leaves')
    // The backend /leaves route returns a paginated response, so we unwrap it and take the items
    const data = unwrap<{ items: LeaveRequest[]; total: number }>(res)
    return data.items
  },

  async getAllLeaves(params?: { status?: string; employee_id?: string; page?: number }): Promise<{ items: LeaveRequest[]; total: number }> {
    const res = await apiClient.get('/leaves', { params })
    return unwrap<{ items: LeaveRequest[]; total: number }>(res)
  },

  async createLeave(data: CreateLeaveRequest): Promise<LeaveRequest> {
    const res = await apiClient.post('/leaves', data)
    return unwrap<LeaveRequest>(res)
  },

  async reviewLeave(id: string, review: LeaveReview): Promise<LeaveRequest> {
    const res = await apiClient.put(`/leaves/${id}/review`, review)
    return unwrap<LeaveRequest>(res)
  },

  async cancelLeave(id: string): Promise<LeaveRequest> {
    const res = await apiClient.put(`/leaves/${id}/cancel`)
    return unwrap<LeaveRequest>(res)
  },

  async getMyBalance(): Promise<LeaveBalance[]> {
    const res = await apiClient.get('/leaves/balance')
    return unwrap<LeaveBalance[]>(res)
  },
}
