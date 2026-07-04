import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, CalendarCheck, CalendarOff, DollarSign } from 'lucide-react'
import { HubDashboardLayout } from '@/layouts/HubDashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { attendanceApi } from '@/api/attendance'
import { leavesApi } from '@/api/leaves'
import { payrollApi } from '@/api/payroll'
import { employeesApi } from '@/api/employees'
import type { AttendanceSummary, LeaveBalance, PayrollRecord, Employee } from '@/types'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [employee, setEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    Promise.all([
      attendanceApi.getMySummary(currentMonth),
      leavesApi.getMyBalance(),
      payrollApi.getMyPayroll(),
      employeesApi.getMe(),
    ]).then(([att, bal, pay, emp]) => {
      setSummary(att)
      setBalances(bal)
      setPayroll(pay)
      setEmployee(emp)
    }).catch(() => {})
  }, [])

  const pendingLeaves = balances.reduce((acc, b) => acc + b.pending_days, 0)
  const annualBalance = balances.find(b => b.leave_type.toLowerCase() === 'annual')
  const latestPayroll = payroll[0]

  const nodes = [
    {
      module: 'profile' as const,
      label: 'My Profile',
      icon: User,
      route: '/profile/me',
      summary: `${employee?.profile_completion_pct ?? 0}% profile complete`,
    },
    {
      module: 'attendance' as const,
      label: 'Attendance',
      icon: CalendarCheck,
      route: '/attendance',
      summary: summary
        ? `${summary.days_present} days present · ${summary.attendance_percentage.toFixed(0)}%`
        : 'Track your check-ins',
    },
    {
      module: 'leave' as const,
      label: 'Leave',
      icon: CalendarOff,
      route: '/leave',
      summary: annualBalance
        ? `${annualBalance.remaining_days} annual days remaining`
        : 'Apply for leave',
    },
    {
      module: 'payroll' as const,
      label: 'Payroll',
      icon: DollarSign,
      route: '/payroll',
      summary: latestPayroll
        ? `Last payslip: $${latestPayroll.net_salary.toLocaleString('en', { maximumFractionDigits: 0 })}`
        : 'View your payslips',
    },
  ]

  const stats = [
    { label: 'Days Present', value: summary?.days_present ?? 0, color: 'sage' as const, icon: CalendarCheck },
    { label: 'Days Absent', value: summary?.days_absent ?? 0, color: 'terracotta' as const },
    { label: 'Pending Leaves', value: pendingLeaves, color: 'olive' as const, icon: CalendarOff },
    {
      label: 'Attendance Rate',
      value: Math.round(summary?.attendance_percentage ?? 0),
      suffix: '%',
      color: 'terracotta' as const,
    },
  ]

  const name = employee?.first_name ?? user?.email?.split('@')[0] ?? 'there'

  return (
    <HubDashboardLayout
      greeting={`${getGreeting()}, ${name}! 👋`}
      subtitle={`${employee?.job_title ?? 'Employee'} · ${employee?.department?.name ?? ''}`}
      nodes={nodes}
      statWidgets={stats}
    />
  )
}
