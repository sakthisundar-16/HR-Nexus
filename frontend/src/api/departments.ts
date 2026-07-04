import apiClient, { unwrap } from './client'
import type { Department } from '@/types'

export interface DepartmentCreate {
  name: string
  code: string
  description?: string
  is_active?: boolean
}

export interface DepartmentUpdate {
  name?: string
  code?: string
  description?: string
  is_active?: boolean
}

export const departmentsApi = {
  async getAll(): Promise<Department[]> {
    const res = await apiClient.get('/departments')
    return unwrap<Department[]>(res)
  },

  async getById(id: string): Promise<Department> {
    const res = await apiClient.get(`/departments/${id}`)
    return unwrap<Department>(res)
  },

  async create(data: DepartmentCreate): Promise<Department> {
    const res = await apiClient.post('/departments', data)
    return unwrap<Department>(res)
  },

  async update(id: string, data: DepartmentUpdate): Promise<Department> {
    const res = await apiClient.put(`/departments/${id}`, data)
    return unwrap<Department>(res)
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/departments/${id}`)
  },
}
