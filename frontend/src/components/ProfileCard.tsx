import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Edit2, Save, X, Phone, MapPin, User, Briefcase, Calendar, Activity } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import type { Employee, EmployeeSelfUpdate, EmployeeAdminUpdate, UserRole } from '@/types'

interface ProfileCardProps {
  employee: Employee
  viewerRole: UserRole
  onSave: (data: EmployeeSelfUpdate | EmployeeAdminUpdate) => Promise<void>
}

const selfSchema = z.object({
  phone: z.string().regex(/^\d{7,15}$/, 'Phone must be 7–15 digits').or(z.literal('')).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().regex(/^\d{7,15}$/, 'Phone must be 7–15 digits').or(z.literal('')).optional(),
})

const adminSchema = selfSchema.extend({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  job_title: z.string().optional(),
  employment_status: z.enum(['active', 'on_leave', 'terminated', 'probation']).optional(),
  base_salary: z.coerce.number().nonnegative().optional(),
})

type SelfFormData = z.infer<typeof selfSchema>
type AdminFormData = z.infer<typeof adminSchema>

export function ProfileCard({ employee, viewerRole, onSave }: ProfileCardProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const isAdmin = viewerRole === 'admin' || viewerRole === 'hr_manager'

  const schema = isAdmin ? adminSchema : selfSchema

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SelfFormData | AdminFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: employee.phone ?? '',
      address: employee.address ?? '',
      city: employee.city ?? '',
      state: employee.state ?? '',
      emergency_contact_name: employee.emergency_contact_name ?? '',
      emergency_contact_phone: employee.emergency_contact_phone ?? '',
      ...(isAdmin ? {
        first_name: employee.first_name,
        last_name: employee.last_name,
        job_title: employee.job_title ?? '',
        employment_status: employee.employment_status,
        base_salary: employee.base_salary,
      } : {}),
    },
  })

  const handleSave = async (data: SelfFormData | AdminFormData) => {
    setSaving(true)
    try {
      await onSave(data)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    reset()
    setEditing(false)
  }

  const completionColor = employee.profile_completion_pct >= 80
    ? 'bg-sage' : employee.profile_completion_pct >= 50
    ? 'bg-terracotta' : 'bg-red-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {employee.profile_picture_url ? (
              <img
                src={employee.profile_picture_url}
                alt={`${employee.first_name}'s avatar`}
                className="w-16 h-16 rounded-2xl object-cover shadow-nexus"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-terracotta to-olive flex items-center justify-center text-white text-2xl font-black shadow-nexus">
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1">
              <StatusBadge status={employee.employment_status} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">{employee.job_title ?? 'No job title'}</p>
            <p className="text-xs text-terracotta font-semibold">{employee.department?.name ?? 'No department'}</p>
          </div>
        </div>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="btn-ghost text-sm"
            id="edit-profile-btn"
          >
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="btn-ghost text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Profile completion */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Profile Completion</span>
          <span className="text-xs font-bold text-[var(--text-primary)]">{employee.profile_completion_pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${employee.profile_completion_pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${completionColor}`}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSave)} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Admin-only: name, job title, status, salary */}
          {isAdmin && editing && (
            <>
              <div>
                <label className="form-label" htmlFor="first_name">First Name</label>
                <input id="first_name" {...(register as typeof register)('first_name' as never)} className="form-field" />
              </div>
              <div>
                <label className="form-label" htmlFor="last_name">Last Name</label>
                <input id="last_name" {...(register as typeof register)('last_name' as never)} className="form-field" />
              </div>
              <div>
                <label className="form-label" htmlFor="job_title">Job Title</label>
                <input id="job_title" {...(register as typeof register)('job_title' as never)} className="form-field" />
              </div>
              <div>
                <label className="form-label" htmlFor="employment_status">Status</label>
                <select id="employment_status" {...(register as typeof register)('employment_status' as never)} className="form-field">
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="probation">Probation</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="base_salary">Base Salary</label>
                <input id="base_salary" type="number" step="0.01" {...(register as typeof register)('base_salary' as never)} className="form-field" />
              </div>
            </>
          )}

          {/* Read-only admin fields for employees */}
          {!editing && (
            <>
              <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Job Title" value={employee.job_title} />
              <InfoRow icon={<User className="w-4 h-4" />} label="Department" value={employee.department?.name} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Hire Date" value={employee.hire_date} />
              <InfoRow icon={<Activity className="w-4 h-4" />} label="Employee ID" value={employee.employee_id} />
            </>
          )}

          {/* Editable fields */}
          {editing ? (
            <>
              <div>
                <label className="form-label flex items-center gap-1.5" htmlFor="phone">
                  <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />Phone
                </label>
                <input id="phone" type="tel" {...register('phone' as never)} className="form-field" placeholder="1234567890" />
                {(errors as Record<string, {message?: string}>).phone && (
                  <p className="form-error">{(errors as Record<string, {message?: string}>).phone?.message}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="form-label flex items-center gap-1.5" htmlFor="address">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />Address
                </label>
                <input id="address" {...register('address' as never)} className="form-field" />
              </div>
              <div>
                <label className="form-label" htmlFor="city">City</label>
                <input id="city" {...register('city' as never)} className="form-field" />
              </div>
              <div>
                <label className="form-label" htmlFor="state">State</label>
                <input id="state" {...register('state' as never)} className="form-field" />
              </div>
              <div>
                <label className="form-label" htmlFor="emergency_contact_name">Emergency Contact Name</label>
                <input id="emergency_contact_name" {...register('emergency_contact_name' as never)} className="form-field" />
              </div>
              <div>
                <label className="form-label" htmlFor="emergency_contact_phone">Emergency Contact Phone</label>
                <input id="emergency_contact_phone" type="tel" {...register('emergency_contact_phone' as never)} className="form-field" />
                {(errors as Record<string, {message?: string}>).emergency_contact_phone && (
                  <p className="form-error">{(errors as Record<string, {message?: string}>).emergency_contact_phone?.message}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={employee.phone} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value={[employee.city, employee.state].filter(Boolean).join(', ')} />
              <InfoRow icon={<User className="w-4 h-4" />} label="Emergency Contact" value={employee.emergency_contact_name} />
            </>
          )}
        </div>

        {editing && (
          <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border)]">
            <button type="submit" disabled={saving} className="btn-nexus" id="save-profile-btn">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </motion.div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-[var(--surface)] flex items-center justify-center text-[var(--text-muted)] flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{value || '—'}</p>
      </div>
    </div>
  )
}
