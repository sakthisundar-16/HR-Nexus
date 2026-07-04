import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EmployeeTable } from '@/components/EmployeeTable'
import { Modal } from '@/components/Modal'
import { employeesApi } from '@/api/employees'
import { departmentsApi } from '@/api/departments'
import type { Employee, Department } from '@/types'
import { globalToast } from '@/layouts/AuthLayout'

const createSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*()_+\-=\[\]{}|;:',./<>?~`]/, 'Password must contain at least one special character'),
  job_title: z.string().optional(),
  department_id: z.string().optional(),
  base_salary: z.coerce.number().nonnegative().optional(),
})
type CreateForm = z.infer<typeof createSchema>

export default function Employees() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const empData = await employeesApi.getAll({ per_page: 100 })
      setEmployees(empData?.items ?? [])
    } catch {
      setEmployees([])
    }

    try {
      const depts = await departmentsApi.getAll()
      setDepartments(Array.isArray(depts) ? depts : [])
    } catch {
      setDepartments([])
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [loadData])

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema) as never,
  })

  const onCreateEmployee = async (data: CreateForm) => {
    try {
      // Sanitize: send null instead of empty string for department_id
      const payload = {
        ...data,
        department_id: data.department_id && data.department_id.trim() !== '' ? data.department_id : undefined,
      }
      const emp = await employeesApi.create(payload)
      setShowCreate(false)
      reset()
      globalToast(`${emp.first_name} added successfully`, 'success')
      // Reload the full list so the new employee appears with all fields correctly populated
      await loadData()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      globalToast(msg ?? 'Failed to create employee', 'error')
    }
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Employees</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{(employees ?? []).length} total employees</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-nexus" id="add-employee-btn">
          <UserPlus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      <EmployeeTable
        employees={employees}
        isLoading={loading}
        onViewProfile={id => navigate(`/profile/${id}`)}
        showSwitchContext={false}
      />

      {/* Create employee modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); reset() }}
        title="Add New Employee"
        size="md"
        footer={
          <>
            <button onClick={() => { setShowCreate(false); reset() }} className="btn-ghost">Cancel</button>
            <button form="create-employee-form" type="submit" disabled={isSubmitting} className="btn-nexus">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Employee'}
            </button>
          </>
        }
      >
        <form id="create-employee-form" onSubmit={handleSubmit(onCreateEmployee)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="first_name">First Name</label>
              <input id="first_name" {...register('first_name')} className="form-field" />
              {errors.first_name && <p className="form-error">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="form-label" htmlFor="last_name">Last Name</label>
              <input id="last_name" {...register('last_name')} className="form-field" />
              {errors.last_name && <p className="form-error">{errors.last_name.message}</p>}
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="c-email">Email</label>
            <input id="c-email" type="email" {...register('email')} className="form-field" />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div>
            <label className="form-label" htmlFor="c-password">Initial Password</label>
            <input id="c-password" type="password" {...register('password')} className="form-field" placeholder="Min 8 chars, A-Z, a-z, 0-9, !@#…" />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="c-job">Job Title</label>
              <input id="c-job" {...register('job_title')} className="form-field" />
            </div>
            <div>
              <label className="form-label" htmlFor="c-dept">Department</label>
              <select id="c-dept" {...register('department_id')} className="form-field">
                <option value="">None</option>
                {(departments ?? []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="c-salary">Base Salary ($)</label>
            <input id="c-salary" type="number" step="0.01" {...register('base_salary')} className="form-field" placeholder="0.00" />
          </div>
        </form>
      </Modal>
    </div>
  )
}
