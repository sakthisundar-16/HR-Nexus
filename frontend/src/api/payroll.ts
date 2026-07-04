import apiClient, { unwrap } from './client'
import type { PayrollRecord, PayrollGenerate } from '@/types'

export const payrollApi = {
  async getMyPayroll(): Promise<PayrollRecord[]> {
    const res = await apiClient.get('/payroll/my-payslips')
    const items = unwrap<PayrollRecord[]>(res)
    return items ?? []
  },

  async getAllPayroll(params?: { employee_id?: string; period?: string; status?: string; page?: number }): Promise<{ items: PayrollRecord[]; total: number }> {
    const res = await apiClient.get('/payroll', { params })
    const items = unwrap<PayrollRecord[]>(res)
    const meta = (res.data as { meta?: { total: number } })?.meta
    return {
      items: items ?? [],
      total: meta?.total ?? (items ?? []).length,
    }
  },

  async getById(id: string): Promise<PayrollRecord> {
    const res = await apiClient.get(`/payroll/${id}`)
    return unwrap<PayrollRecord>(res)
  },

  async generate(data: PayrollGenerate): Promise<PayrollRecord> {
    const res = await apiClient.post('/payroll/generate', data)
    return unwrap<PayrollRecord>(res)
  },

  async process(id: string, status: 'processed' | 'paid', paymentDate?: string): Promise<PayrollRecord> {
    const res = await apiClient.put(`/payroll/${id}/process`, {
      status,
      payment_date: paymentDate,
    })
    return unwrap<PayrollRecord>(res)
  },
}
