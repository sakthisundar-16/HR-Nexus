import apiClient, { unwrap } from './client'
import type { Employee, EmployeeSelfUpdate, EmployeeAdminUpdate, EmployeeCreate } from '@/types'

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export const employeesApi = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; department_id?: string }): Promise<PaginatedResponse<Employee>> {
    const res = await apiClient.get('/employees', { params })
    const items = unwrap<Employee[]>(res)
    const meta = (res.data as { meta?: { total: number; page: number; per_page: number; total_pages: number } })?.meta
    return {
      items: items ?? [],
      total: meta?.total ?? (items ?? []).length,
      page: meta?.page ?? 1,
      per_page: meta?.per_page ?? 100,
      total_pages: meta?.total_pages ?? 1,
    }
  },

  async getById(id: string): Promise<Employee> {
    const res = await apiClient.get(`/employees/${id}`)
    return unwrap<Employee>(res)
  },

  async getMe(): Promise<Employee> {
    const profileRes = await apiClient.get('/auth/me')
    const user = unwrap<{ id: string; email: string; role: string }>(profileRes)
    const empRes = await apiClient.get('/employees', { params: { per_page: 100 } })
    const empData = unwrap<PaginatedResponse<Employee>>(empRes)
    const me = empData?.items?.find(e => e.user_id === user.id)
    if (!me) {
      throw new Error('Employee profile not found')
    }
    return me
  },

  async updateMe(patch: EmployeeSelfUpdate): Promise<Employee> {
    const me = await employeesApi.getMe()
    const res = await apiClient.patch(`/employees/${me.id}/profile`, patch)
    return unwrap<Employee>(res)
  },

  async updateById(id: string, patch: EmployeeAdminUpdate): Promise<Employee> {
    const res = await apiClient.put(`/employees/${id}`, patch)
    return unwrap<Employee>(res)
  },

  async create(data: EmployeeCreate): Promise<Employee> {
    const res = await apiClient.post('/auth/register', data)
    return unwrap<Employee>(res)
  },
}
