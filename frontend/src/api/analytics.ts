import apiClient, { unwrap } from './client'
import type { DashboardStats, DepartmentDistributionItem, MonthlyTrendItem, LeaveStatItem, ActivityItem } from '@/types'

export const analyticsApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await apiClient.get('/analytics/dashboard')
    return unwrap<DashboardStats>(res)
  },

  async getDepartmentDistribution(): Promise<DepartmentDistributionItem[]> {
    const res = await apiClient.get('/analytics/department-distribution')
    return unwrap<DepartmentDistributionItem[]>(res)
  },

  async getMonthlyTrends(months?: number): Promise<MonthlyTrendItem[]> {
    const res = await apiClient.get('/analytics/monthly-trends', {
      params: months ? { months } : undefined,
    })
    return unwrap<MonthlyTrendItem[]>(res)
  },

  async getLeaveStatistics(): Promise<LeaveStatItem[]> {
    const res = await apiClient.get('/analytics/leave-statistics')
    return unwrap<LeaveStatItem[]>(res)
  },

  async getActivityTimeline(limit?: number): Promise<ActivityItem[]> {
    const res = await apiClient.get('/analytics/recent-activities', {
      params: limit ? { limit } : undefined,
    })
    return unwrap<ActivityItem[]>(res)
  },
}
