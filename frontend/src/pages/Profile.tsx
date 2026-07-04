import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ProfileCard } from '@/components/ProfileCard'
import { useAuth } from '@/hooks/useAuth'
import { employeesApi } from '@/api/employees'
import type { Employee, EmployeeSelfUpdate, EmployeeAdminUpdate } from '@/types'
import { globalToast } from '@/layouts/AuthLayout'

export default function Profile() {
  const { id } = useParams<{ id: string }>()
  const { role } = useAuth()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const isMe = !id || id === 'me'
    const fetch = isMe ? employeesApi.getMe() : employeesApi.getById(id!)
    fetch
      .then(setEmployee)
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (data: EmployeeSelfUpdate | EmployeeAdminUpdate) => {
    if (!employee) return
    const isAdmin = role === 'admin' || role === 'hr_manager'
    const isMe = !id || id === 'me'
    try {
      let updated: Employee
      if (isMe && !isAdmin) {
        updated = await employeesApi.updateMe(data as EmployeeSelfUpdate)
      } else {
        updated = await employeesApi.updateById(employee.id, data as EmployeeAdminUpdate)
      }
      setEmployee(updated)
      globalToast('Profile updated successfully', 'success')
    } catch {
      globalToast('Failed to update profile', 'error')
      throw new Error('Update failed')
    }
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <p className="text-[var(--text-muted)]">{error || 'Profile not found'}</p>
      </div>
    )
  }

  return (
    <div className="page-container max-w-3xl">
      <h1 className="text-2xl font-black text-[var(--text-primary)] mb-6">
        {(!id || id === 'me') ? 'My Profile' : `${employee.first_name} ${employee.last_name}`}
      </h1>
      <ProfileCard employee={employee} viewerRole={role!} onSave={handleSave} />
    </div>
  )
}
