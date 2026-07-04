import React, { useEffect, useState, useCallback } from 'react'
import {
  Building2, PlusCircle, Users, Edit2, Trash2, ArrowRightLeft,
  Loader2, ClipboardList, Info, BadgeDollarSign, HelpCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/Modal'
import { departmentsApi } from '@/api/departments'
import { employeesApi } from '@/api/employees'
import type { Department, Employee } from '@/types'
import { globalToast } from '@/layouts/AuthLayout'
import { useAuth } from '@/hooks/useAuth'

// Validation Schemas
const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric (e.g. ENG, HR, SALES_HQ)'),
  description: z.string().max(500).optional().or(z.literal('')),
})
type DepartmentForm = z.infer<typeof departmentSchema>

const assignSchema = z.object({
  employee_id: z.string().min(1, 'Please select an employee'),
  department_id: z.string().min(1, 'Please select a department'),
})
type AssignForm = z.infer<typeof assignSchema>

export default function Departments() {
  const { role } = useAuth()
  const isAdmin = role === 'admin' || role === 'hr_manager'

  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [showCreate, setShowCreate] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [showAssign, setShowAssign] = useState(false)
  const [assigningEmployee, setAssigningEmployee] = useState<string>('')
  const [assigningDept, setAssigningDept] = useState<string>('')

  // Forms
  const {
    register: registerDept,
    handleSubmit: handleSubmitDept,
    reset: resetDept,
    setValue: setDeptValue,
    formState: { errors: deptErrors, isSubmitting: deptSubmitting },
  } = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema) as never,
  })

  const {
    handleSubmit: handleSubmitAssign,
    formState: { isSubmitting: assignSubmitting },
  } = useForm<AssignForm>()

  const loadData = useCallback(async () => {
    try {
      const depts = await departmentsApi.getAll()
      setDepartments(Array.isArray(depts) ? depts : [])
    } catch {
      setDepartments([])
      globalToast('Failed to load departments', 'error')
    }

    try {
      const emps = await employeesApi.getAll({ per_page: 100 })
      setEmployees(emps?.items ?? [])
    } catch {
      setEmployees([])
      globalToast('Failed to load employees', 'error')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [loadData])

  // Open Edit Modal
  const startEdit = (dept: Department) => {
    setEditingDept(dept)
    setDeptValue('name', dept.name)
    setDeptValue('code', dept.code)
    setDeptValue('description', dept.description ?? '')
  }

  // Create / Update Department Handler
  const onSubmitDept = async (data: DepartmentForm) => {
    try {
      if (editingDept) {
        // Update
        const updated = await departmentsApi.update(editingDept.id, data)
        setDepartments(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d))
        globalToast(`Department "${data.name}" updated successfully`, 'success')
      } else {
        // Create
        const created = await departmentsApi.create(data)
        setDepartments(prev => [...prev, created])
        globalToast(`Department "${data.name}" created successfully`, 'success')
      }
      closeDeptModal()
      await loadData()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      globalToast(msg ?? 'Failed to save department', 'error')
    }
  }

  const closeDeptModal = () => {
    setShowCreate(false)
    setEditingDept(null)
    resetDept()
  }

  // Delete Department Handler
  const handleDeleteDept = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" department?`)) return
    try {
      await departmentsApi.delete(id)
      setDepartments(prev => prev.filter(d => d.id !== id))
      globalToast(`Department "${name}" deleted successfully`, 'success')
      await loadData()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      globalToast(msg ?? 'Failed to delete department. Make sure it contains no employees.', 'error')
    }
  }

  // Assign Employee Handler
  const onAssignSubmit = async () => {
    if (!assigningEmployee || !assigningDept) {
      globalToast('Please select both an employee and a department', 'error')
      return
    }
    try {
      // Find employee to update
      const emp = employees.find(e => e.id === assigningEmployee)
      if (!emp) return

      await employeesApi.updateById(assigningEmployee, {
        department_id: assigningDept === 'none' ? null : assigningDept,
      })

      globalToast(`Employee successfully assigned`, 'success')
      setShowAssign(false)
      setAssigningEmployee('')
      setAssigningDept('')
      await loadData()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      globalToast(msg ?? 'Failed to assign employee', 'error')
    }
  }

  const getDeptEmployees = (deptId: string) => {
    return (employees ?? []).filter(e => e.department_id === deptId)
  }

  const unassignedEmployees = (employees ?? []).filter(e => !e.department_id)

  return (
    <div className="page-container space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Departments</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Manage company departments and allocate staff
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAssign(true)}
              className="btn-ghost flex items-center gap-2 text-sm"
              id="assign-employee-btn"
            >
              <ArrowRightLeft className="w-4 h-4" /> Assign Staff
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-nexus flex items-center gap-2 text-sm"
              id="add-dept-btn"
            >
              <PlusCircle className="w-4 h-4" /> Add Department
            </button>
          </div>
        )}
      </div>

      {/* Unassigned Staff Notice Banner */}
      {unassignedEmployees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-terracotta/10 border border-terracotta/20 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-[var(--text-primary)]">
              Unassigned Staff Members ({unassignedEmployees.length})
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              The following employees do not belong to any department yet: {' '}
              {unassignedEmployees.map((e, idx) => (
                <span key={e.id} className="font-semibold text-[var(--text-primary)]">
                  {e.first_name} {e.last_name}{idx < unassignedEmployees.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setAssigningEmployee(unassignedEmployees[0].id)
                setShowAssign(true)
              }}
              className="px-3 py-1.5 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta-400 transition-all flex-shrink-0"
            >
              Assign Now
            </button>
          )}
        </motion.div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
      ) : departments.length === 0 ? (
        <div className="glass-card text-center py-16 text-[var(--text-muted)]">
          <Building2 className="w-12 h-12 mx-auto text-terracotta/30 mb-3" />
          <p className="font-semibold">No departments found</p>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn-nexus text-sm mt-4">
              Create Your First Department
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const deptEmps = getDeptEmployees(dept.id)
            return (
              <motion.div
                key={dept.id}
                layout
                className="relative overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-gradient-to-br from-[var(--glass-bg)] via-[var(--surface)] to-[var(--glass-bg)] p-6 flex flex-col justify-between"
                style={{
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 32px rgba(130,113,72,0.12), inset 0 1px 0 rgba(255,255,255,0.4)',
                }}
              >
                <div>
                  {/* Top Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-terracotta to-sage" />

                  {/* Title & Actions */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-black text-lg text-[var(--text-primary)] leading-snug">
                        {dept.name}
                      </h3>
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-olive/10 text-olive text-[10px] font-bold uppercase tracking-wider mt-1">
                        {dept.code}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEdit(dept)}
                          className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-terracotta transition-all"
                          title="Edit Department"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDept(dept.id, dept.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--text-muted)] hover:text-red-500 transition-all"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6 line-clamp-2">
                    {dept.description || 'No description provided.'}
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[var(--surface)] mb-6 border border-[var(--border)]">
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total</p>
                      <p className="text-sm font-black text-terracotta-400 mt-0.5">
                        {dept.employee_count ?? deptEmps.length}
                      </p>
                    </div>
                    <div className="text-center border-x border-[var(--border)]">
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Active</p>
                      <p className="text-sm font-black text-sage-500 mt-0.5">
                        {dept.active_employee_count ?? deptEmps.filter(e => e.employment_status === 'active').length}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Avg. Salary</p>
                      <p className="text-sm font-black text-olive mt-0.5 truncate" title={`$${(dept.average_salary ?? 0).toLocaleString()}`}>
                        ${Math.round((dept.average_salary ?? 0) / 1000)}k
                      </p>
                    </div>
                  </div>

                  {/* Employees List */}
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-2.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sage" />
                      Department Staff ({deptEmps.length})
                    </h4>
                    {deptEmps.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-muted)] italic">No staff assigned yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {deptEmps.map((emp) => (
                          <div
                            key={emp.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--surface)] border border-[var(--border)] text-[10px] font-semibold text-[var(--text-primary)] transition-all"
                          >
                            <span>{emp.first_name} {emp.last_name}</span>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setAssigningEmployee(emp.id)
                                  setAssigningDept('none')
                                  setShowAssign(true)
                                }}
                                className="w-3.5 h-3.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--text-muted)] hover:text-red-500 flex items-center justify-center font-bold text-[8px]"
                                title="Unassign Employee"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── CREATE / EDIT DEPARTMENT MODAL ────────────────────────────── */}
      <Modal
        isOpen={showCreate || !!editingDept}
        onClose={closeDeptModal}
        title={editingDept ? 'Edit Department' : 'Add New Department'}
        footer={
          <>
            <button onClick={closeDeptModal} className="btn-ghost">Cancel</button>
            <button
              form="dept-form"
              type="submit"
              disabled={deptSubmitting}
              className="btn-nexus"
            >
              {deptSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Department'}
            </button>
          </>
        }
      >
        <form id="dept-form" onSubmit={handleSubmitDept(onSubmitDept)} className="space-y-4" noValidate>
          <div>
            <label className="form-label" htmlFor="dept-name">Department Name</label>
            <input id="dept-name" {...registerDept('name')} className="form-field" placeholder="e.g., Human Resources" />
            {deptErrors.name && <p className="form-error">{deptErrors.name.message}</p>}
          </div>

          <div>
            <label className="form-label" htmlFor="dept-code">Department Code</label>
            <input
              id="dept-code"
              {...registerDept('code')}
              className="form-field uppercase"
              placeholder="e.g., HR, ENG, SALES"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Must be uppercase alphanumeric. Max 20 characters.
            </p>
            {deptErrors.code && <p className="form-error">{deptErrors.code.message}</p>}
          </div>

          <div>
            <label className="form-label" htmlFor="dept-desc">Description</label>
            <textarea
              id="dept-desc"
              {...registerDept('description')}
              rows={3}
              placeholder="Provide a brief summary of the department's focus…"
              className="form-field resize-none"
            />
            {deptErrors.description && <p className="form-error">{deptErrors.description.message}</p>}
          </div>
        </form>
      </Modal>

      {/* ── ASSIGN EMPLOYEES MODAL ────────────────────────────────────── */}
      <Modal
        isOpen={showAssign}
        onClose={() => { setShowAssign(false); setAssigningEmployee(''); setAssigningDept('') }}
        title="Assign Staff Member"
        footer={
          <>
            <button onClick={() => { setShowAssign(false); setAssigningEmployee(''); setAssigningDept('') }} className="btn-ghost">Cancel</button>
            <button
              onClick={onAssignSubmit}
              disabled={assignSubmitting}
              className="btn-nexus"
            >
              {assignSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning…</> : 'Confirm Assignment'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label font-bold" htmlFor="assign-employee">Select Employee</label>
            <select
              id="assign-employee"
              value={assigningEmployee}
              onChange={e => setAssigningEmployee(e.target.value)}
              className="form-field"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} ({e.job_title || 'No Title'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label font-bold" htmlFor="assign-dept">Assign to Department</label>
            <select
              id="assign-dept"
              value={assigningDept}
              onChange={e => setAssigningDept(e.target.value)}
              className="form-field"
            >
              <option value="">-- Choose Department --</option>
              <option value="none">None (Remove from current department)</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-start gap-2.5">
            <BadgeDollarSign className="w-5 h-5 text-olive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Assigning an employee updates their profile, aligning them under the target department's payroll and attendance reporting.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
