import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { PayrollBreakdown } from '@/components/PayrollBreakdown'
import { StatusBadge } from '@/components/StatusBadge'
import { useAuth } from '@/hooks/useAuth'
import { payrollApi } from '@/api/payroll'
import { employeesApi } from '@/api/employees'
import type { PayrollRecord, Employee } from '@/types'
import { globalToast } from '@/layouts/AuthLayout'

const genSchema = z.object({
  employee_id: z.string().min(1, 'Select an employee'),
  payroll_period: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
  allowances: z.coerce.number().nonnegative(),
  deductions: z.coerce.number().nonnegative(),
  overtime_pay: z.coerce.number().nonnegative(),
})
type GenForm = z.infer<typeof genSchema>

export default function Payroll() {
  const { role } = useAuth()
  const isAdmin = role === 'admin' || role === 'hr_manager'
  const [myPayroll, setMyPayroll] = useState<PayrollRecord[]>([])
  const [allPayroll, setAllPayroll] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (isAdmin) {
        try {
          const [allData, emps] = await Promise.all([
            payrollApi.getAllPayroll(),
            employeesApi.getAll({ per_page: 100 }),
          ])
          setAllPayroll(allData?.items ?? [])
          setEmployees(emps?.items ?? [])
        } catch { /* silent */ }
      }
      try {
        const my = await payrollApi.getMyPayroll()
        const safeMyPayroll = Array.isArray(my) ? my : []
        setMyPayroll(safeMyPayroll)
        if (safeMyPayroll.length > 0) setSelectedRecord(safeMyPayroll[0])
      } catch {
        setMyPayroll([])
      }
    }
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [isAdmin])

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GenForm>({
    resolver: zodResolver(genSchema) as never,
    defaultValues: {
      payroll_period: new Date().toISOString().slice(0, 7),
      allowances: 0,
      deductions: 0,
      overtime_pay: 0,
    },
  })

  const onGenerate = async (data: GenForm) => {
    try {
      const record = await payrollApi.generate(data)
      setAllPayroll(prev => [record, ...prev])
      setShowForm(false)
      reset()
      globalToast('Payroll generated successfully', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      globalToast(msg ?? 'Failed to generate payroll', 'error')
    }
  }

  const handleProcess = async (id: string, status: 'processed' | 'paid') => {
    try {
      const updated = await payrollApi.process(id, status)
      setAllPayroll(prev => prev.map(p => p.id === id ? updated : p))
      if (selectedRecord?.id === id) setSelectedRecord(updated)
      globalToast(`Payroll marked as ${status}`, 'success')
    } catch { globalToast('Failed to update payroll status', 'error') }
  }

  const getEmpName = (id: string) => {
    const e = employees.find(emp => emp.id === id)
    return e ? `${e.first_name} ${e.last_name}` : id.slice(0, 8) + '…'
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Payroll</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(s => !s)} className="btn-nexus" id="generate-payroll-btn">
            <PlusCircle className="w-4 h-4" />
            {showForm ? 'Close' : 'Generate Payroll'}
          </button>
        )}
      </div>

      {/* Admin: generate form */}
      {isAdmin && showForm && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
          <h2 className="font-bold text-[var(--text-primary)] mb-5">Generate Payroll</h2>
          <form onSubmit={handleSubmit(onGenerate)} className="grid grid-cols-2 gap-4" noValidate>
            <div className="col-span-2">
              <label className="form-label" htmlFor="employee_id">Employee</label>
              <select id="employee_id" {...register('employee_id')} className="form-field">
                <option value="">Select employee…</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</option>
                ))}
              </select>
              {errors.employee_id && <p className="form-error">{errors.employee_id.message}</p>}
            </div>
            <div>
              <label className="form-label" htmlFor="payroll_period">Pay Period (YYYY-MM)</label>
              <input id="payroll_period" {...register('payroll_period')} className="form-field" placeholder="2026-07" />
              {errors.payroll_period && <p className="form-error">{errors.payroll_period.message}</p>}
            </div>
            <div>
              <label className="form-label" htmlFor="allowances">Allowances ($)</label>
              <input id="allowances" type="number" step="0.01" {...register('allowances')} className="form-field" />
            </div>
            <div>
              <label className="form-label" htmlFor="deductions">Extra Deductions ($)</label>
              <input id="deductions" type="number" step="0.01" {...register('deductions')} className="form-field" />
            </div>
            <div>
              <label className="form-label" htmlFor="overtime_pay">Overtime Pay ($)</label>
              <input id="overtime_pay" type="number" step="0.01" {...register('overtime_pay')} className="form-field" />
            </div>
            <div className="col-span-2 flex justify-end">
              <button type="submit" disabled={isSubmitting} className="btn-nexus">
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : 'Generate'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Employee payslip view */}
      {!isAdmin && (
        <div className="space-y-6">
          {/* Payslip selector */}
          {myPayroll.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {myPayroll.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedRecord(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedRecord?.id === p.id ? 'bg-terracotta text-white shadow-nexus' : 'btn-ghost'
                  }`}
                >
                  {p.payroll_period}
                  <span className="ml-2"><StatusBadge status={p.status} /></span>
                </button>
              ))}
            </div>
          )}
          {selectedRecord ? (
            <PayrollBreakdown record={selectedRecord} history={myPayroll} />
          ) : (
            <div className="glass-card text-center py-12 text-[var(--text-muted)]">
              {loading ? 'Loading payroll data…' : 'No payroll records found'}
            </div>
          )}
        </div>
      )}

      {/* Admin payroll table */}
      {isAdmin && (
        <div className="glass-card !p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="font-bold text-[var(--text-primary)]">All Payroll Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Employee', 'Period', 'Gross', 'Net', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border)]">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4"><div className="h-4 rounded bg-[var(--surface)] animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : allPayroll.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">No payroll records</td></tr>
                ) : (
                  allPayroll.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{getEmpName(p.employee_id)}</td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">{p.payroll_period}</td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">${p.gross_salary.toLocaleString('en', { maximumFractionDigits: 0 })}</td>
                      <td className="px-6 py-4 font-bold text-sage-500">${p.net_salary.toLocaleString('en', { maximumFractionDigits: 0 })}</td>
                      <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {p.status === 'draft' && (
                            <button onClick={() => handleProcess(p.id, 'processed')} className="btn-ghost text-xs py-1 px-2">Process</button>
                          )}
                          {p.status === 'processed' && (
                            <button onClick={() => handleProcess(p.id, 'paid')} className="btn-sage text-xs py-1 px-2">Mark Paid</button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
