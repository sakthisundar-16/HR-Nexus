import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from '@/layouts/RootLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { RoleGuard } from '@/components/RoleGuard'
import SignIn from '@/pages/SignIn'
import SignUp from '@/pages/SignUp'
import EmployeeDashboard from '@/pages/EmployeeDashboard'
import AdminDashboard from '@/pages/AdminDashboard'
import Profile from '@/pages/Profile'
import Attendance from '@/pages/Attendance'
import Leave from '@/pages/Leave'
import Payroll from '@/pages/Payroll'
import Employees from '@/pages/Employees'
import Departments from '@/pages/Departments'

function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
      <div className="text-6xl font-black gradient-text">404</div>
      <p className="text-[var(--text-muted)] text-lg">Page not found</p>
      <a href="/" className="btn-nexus">Go Home</a>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      // Public routes
      { path: 'sign-in', element: <SignIn /> },
      { path: 'sign-up', element: <SignUp /> },

      // Protected routes — all roles
      {
        element: <RoleGuard />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              // Root redirect
              { index: true, element: <Navigate to="/dashboard/employee" replace /> },

              // Employee-only dashboard
              {
                element: <RoleGuard allowedRoles={['employee']} redirectTo="/dashboard/admin" />,
                children: [
                  { path: 'dashboard/employee', element: <EmployeeDashboard /> },
                ],
              },

              // Admin/HR-only dashboard & employees management
              {
                element: <RoleGuard allowedRoles={['admin', 'hr_manager']} redirectTo="/dashboard/employee" />,
                children: [
                  { path: 'dashboard/admin', element: <AdminDashboard /> },
                  { path: 'employees', element: <Employees /> },
                  { path: 'departments', element: <Departments /> },
                ],
              },

              // Shared routes (all authenticated)
              { path: 'profile/:id', element: <Profile /> },
              { path: 'attendance', element: <Attendance /> },
              { path: 'leave', element: <Leave /> },
              { path: 'payroll', element: <Payroll /> },
            ],
          },
        ],
      },

      // Catch-all
      { path: '*', element: <NotFound /> },
    ],
  },
])
