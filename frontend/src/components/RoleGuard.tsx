import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export function RoleGuard({ allowedRoles, redirectTo = '/sign-in' }: RoleGuardProps) {
  const { isAuthenticated, role, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-terracotta border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--text-muted)] font-medium">Loading HR NEXUS…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const defaultDash = (role === 'admin' || role === 'hr_manager')
      ? '/dashboard/admin'
      : '/dashboard/employee'
    return <Navigate to={defaultDash} replace />
  }

  return <Outlet />
}
