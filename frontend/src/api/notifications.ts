import apiClient, { unwrap } from './client'
import type { Notification } from '@/types'

export const notificationsApi = {
  async getAll(): Promise<Notification[]> {
    const res = await apiClient.get('/notifications')
    return unwrap<Notification[]>(res)
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all')
  },
}
