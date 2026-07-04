import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, CalendarCheck, CalendarOff, DollarSign, Activity,
  CheckCircle, XCircle, Clock, TrendingUp, TrendingDown,
  Sparkles, ClipboardList, Zap, Building2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { HubDashboardLayout } from '@/layouts/HubDashboardLayout'
import { analyticsApi } from '@/api/analytics'
import { leavesApi } from '@/api/leaves'
import { employeesApi } from '@/api/employees'
import { Modal } from '@/components/Modal'
import { StatusBadge } from '@/components/StatusBadge'
import { globalToast } from '@/layouts/AuthLayout'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts'
import type {
  DashboardStats, DepartmentDistributionItem, MonthlyTrendItem,
  ActivityItem, LeaveRequest, Employee,
} from '@/types'

const COLORS = ['#E8A07C', '#A5AF79', '#827148', '#FFD090', '#CC6030', '#6F7A44']

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getLeaveTypeColor(type: string) {
  const map: Record<string, string> = {
    annual: 'from-sage to-sage-400',
    sick: 'from-terracotta to-terracotta-400',
    personal: 'from-olive to-olive-400',
    maternity: 'from-terracotta to-sage',
    paternity: 'from-sage to-olive',
    unpaid: 'from-olive to-terracotta',
  }
  return map[type.toLowerCase()] ?? 'from-terracotta to-olive'
}

function getActivityIcon(action: string) {
  if (action.includes('LEAVE')) return CalendarOff
  if (action.includes('ATTENDANCE') || action.includes('CLOCK')) return CalendarCheck
  if (action.includes('PAYROLL')) return DollarSign
  if (action.includes('PROFILE') || action.includes('UPDATE')) return Users
  return Activity
}

function getActivityColor(action: string) {
  if (action.includes('LEAVE')) return 'text-terracotta bg-terracotta/10'
  if (action.includes('ATTENDANCE') || action.includes('CLOCK')) return 'text-sage-400 bg-sage/10'
  if (action.includes('PAYROLL')) return 'text-olive bg-olive/10'
  return 'text-[var(--text-muted)] bg-[var(--surface)]'
}

// ─── Inline Pending Leave Row ─────────────────────────────────────────────────
interface PendingLeaveRowProps {
  leave: LeaveRequest
  employeeName: string
  avatar: string
  index: number
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

function PendingLeaveRow({ leave, employeeName, avatar, index, onApprove, onReject }: PendingLeaveRowProps) {
  const [processing, setProcessing] = useState<'approve' | 'reject' | null>(null)
  const duration = Math.round(
    (new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / 86400000
  ) + 1
  const gradient = getLeaveTypeColor(leave.leave_type)

  const doApprove = async () => {
    setProcessing('approve')
    try { await onApprove(leave.id) } finally { setProcessing(null) }
  }
  const doReject = async () => {
    setProcessing('reject')
    try { await onReject(leave.id) } finally { setProcessing(null) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 280, damping: 28 }}
      className="group relative flex items-center gap-4 p-4 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--glass-bg)] to-[var(--surface)] hover:border-terracotta/30 hover:shadow-nexus transition-all duration-300"
      id={`pending-leave-${leave.id}`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b ${gradient} opacity-70`} />

      {/* Avatar */}
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-black shadow-nexus flex-shrink-0`}>
        {avatar}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-sm text-[var(--text-primary)] truncate">{employeeName}</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r ${gradient} text-white`}>
            {leave.leave_type}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            <CalendarOff className="w-3 h-3" />
            {leave.start_date} → {leave.end_date}
          </span>
          <span className="text-xs font-semibold text-terracotta-400">
            {duration} day{duration !== 1 ? 's' : ''}
          </span>
        </div>
        {leave.reason && (
          <p className="text-[11px] text-[var(--text-muted)] mt-1 italic line-clamp-1">"{leave.reason}"</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={doApprove}
          disabled={!!processing}
          title="Approve"
          id={`dashboard-approve-${leave.id}`}
          className="w-9 h-9 rounded-xl bg-sage/10 hover:bg-sage/20 border border-sage/20 hover:border-sage/40 flex items-center justify-center text-sage-500 hover:text-sage-400 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
        >
          {processing === 'approve'
            ? <div className="w-4 h-4 rounded-full border-2 border-sage-400 border-t-transparent animate-spin" />
            : <CheckCircle className="w-4 h-4" />}
        </button>
        <button
          onClick={doReject}
          disabled={!!processing}
          title="Reject"
          id={`dashboard-reject-${leave.id}`}
          className="w-9 h-9 rounded-xl bg-terracotta/10 hover:bg-terracotta/20 border border-terracotta/20 hover:border-terracotta/40 flex items-center justify-center text-terracotta hover:text-terracotta-400 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
        >
          {processing === 'reject'
            ? <div className="w-4 h-4 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
            : <XCircle className="w-4 h-4" />}
        </button>
      </div>

      {/* Submitted time */}
      <span className="absolute top-2 right-2 text-[10px] text-[var(--text-muted)]">
        {timeAgo(leave.created_at)}
      </span>
    </motion.div>
  )
}

// ─── Glassmorphic Chart Card ──────────────────────────────────────────────────
function ChartCard({ title, icon: Icon, children, accentColor = '#E8A07C' }: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  accentColor?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 28 }}
      className="relative overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-gradient-to-br from-[var(--glass-bg)] via-[var(--surface)] to-[var(--glass-bg)]"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: `0 8px 40px rgba(130,113,72,0.12), 0 0 0 1px rgba(255,255,255,0.4) inset, 0 1px 0 rgba(255,255,255,0.6) inset`,
      }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: accentColor }}
      />
      <div className="relative p-6">
        <div className="flex items-center gap-2.5 mb-5">
          {Icon && (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}20` }}>
              <span style={{ color: accentColor, display: 'flex' }}>
                <Icon className="w-4 h-4" />
              </span>
            </div>
          )}
          <h3 className="font-black text-[var(--text-primary)]">{title}</h3>
        </div>
        {children}
      </div>
    </motion.div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [departments, setDepartments] = useState<DepartmentDistributionItem[]>([])
  const [trends, setTrends] = useState<MonthlyTrendItem[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectRemarks, setRejectRemarks] = useState('')
  const [rejectProcessing, setRejectProcessing] = useState(false)

  const loadAll = useCallback(async () => {
    // Fetch analytics (may 404 if not yet implemented) — silent failures allowed
    const analyticsResults = await Promise.allSettled([
      analyticsApi.getDashboardStats(),
      analyticsApi.getDepartmentDistribution(),
      analyticsApi.getMonthlyTrends(6),
      analyticsApi.getActivityTimeline(10),
    ])
    if (analyticsResults[0].status === 'fulfilled') setStats(analyticsResults[0].value)
    if (analyticsResults[1].status === 'fulfilled') setDepartments(analyticsResults[1].value ?? [])
    if (analyticsResults[2].status === 'fulfilled') setTrends(analyticsResults[2].value ?? [])
    if (analyticsResults[3].status === 'fulfilled') setActivity(analyticsResults[3].value ?? [])

    // Fetch leaves and employees — these are critical
    try {
      const leaveRes = await leavesApi.getAllLeaves({ status: 'pending' })
      setPendingLeaves(leaveRes?.items ?? [])
    } catch { /* silent */ }

    try {
      const empData = await employeesApi.getAll({ per_page: 100 })
      setEmployees(empData?.items ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadAll().catch(() => {}).finally(() => setLoading(false))
  }, [loadAll])

  const getEmployeeName = (empId: string) => {
    const e = employees.find(x => x.id === empId)
    return e ? `${e.first_name} ${e.last_name}` : 'Employee'
  }
  const getEmployeeAvatar = (empId: string) => {
    const e = employees.find(x => x.id === empId)
    return e ? e.first_name[0].toUpperCase() : 'E'
  }

  const handleApprove = async (id: string) => {
    try {
      await leavesApi.reviewLeave(id, { status: 'approved' })
      globalToast('Leave approved ✓', 'success')
      setPendingLeaves(prev => prev.filter(l => l.id !== id))
      setStats(s => s ? { ...s, pending_leave_requests: Math.max(0, s.pending_leave_requests - 1) } : s)
    } catch { globalToast('Failed to approve', 'error') }
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectRemarks.trim()) return
    setRejectProcessing(true)
    try {
      await leavesApi.reviewLeave(rejectTarget, { status: 'rejected', admin_remarks: rejectRemarks })
      globalToast('Leave rejected', 'info')
      setPendingLeaves(prev => prev.filter(l => l.id !== rejectTarget))
      setStats(s => s ? { ...s, pending_leave_requests: Math.max(0, s.pending_leave_requests - 1) } : s)
      setRejectTarget(null)
      setRejectRemarks('')
    } catch { globalToast('Failed to reject', 'error') }
    finally { setRejectProcessing(false) }
  }

  const nodes = [
    { module: 'employees' as const, label: 'Employees', icon: Users, route: '/employees', summary: `${stats?.active_employees ?? 0} active members` },
    { module: 'attendance' as const, label: 'Attendance', icon: CalendarCheck, route: '/attendance', summary: `${stats?.attendance_percentage_today?.toFixed(0) ?? 0}% present today` },
    { module: 'leave' as const, label: 'Leave Queue', icon: CalendarOff, route: '/leave', summary: `${stats?.pending_leave_requests ?? 0} pending approval` },
    { module: 'payroll' as const, label: 'Payroll', icon: DollarSign, route: '/payroll', summary: `$${((stats?.monthly_payroll_cost ?? 0) / 1000).toFixed(1)}k this month` },
  ]

  const statWidgets = [
    { label: 'Total Employees', value: stats?.total_employees ?? 0, icon: Users, color: 'terracotta' as const },
    { label: 'Present Today', value: stats?.present_today ?? 0, icon: CalendarCheck, color: 'sage' as const },
    { label: 'On Leave', value: stats?.on_leave_today ?? 0, icon: CalendarOff, color: 'olive' as const },
    { label: 'Pending Leaves', value: stats?.pending_leave_requests ?? 0, icon: ClipboardList, color: 'terracotta' as const },
  ]

  return (
    <HubDashboardLayout
      greeting="Admin Dashboard 🎯"
      subtitle="Full system overview and HR management"
      nodes={nodes}
      statWidgets={statWidgets}
    >
      {/* ── PENDING LEAVE QUEUE ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 28 }}
        className="relative overflow-hidden rounded-3xl border border-terracotta/20"
        style={{
          background: 'linear-gradient(135deg, rgba(232,160,124,0.08) 0%, rgba(255,238,214,0.55) 50%, rgba(165,175,121,0.06) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(232,160,124,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        {/* Decorative glow orbs */}
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-terracotta/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-sage/10 blur-2xl pointer-events-none" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-terracotta to-terracotta-400 flex items-center justify-center shadow-nexus">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-[var(--text-primary)] text-lg">Pending Leave Requests</h2>
                <p className="text-xs text-[var(--text-muted)]">Employee requests awaiting your review</p>
              </div>
              {pendingLeaves.length > 0 && (
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-terracotta text-white text-xs font-black shadow-nexus"
                >
                  {pendingLeaves.length}
                </motion.span>
              )}
            </div>
            <button
              onClick={() => navigate('/leave')}
              className="btn-ghost text-sm flex items-center gap-1.5"
              id="view-all-leaves-btn"
            >
              <Zap className="w-3.5 h-3.5" />
              View All Leaves
            </button>
          </div>

          {/* Leave list */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-3 border-terracotta border-t-transparent animate-spin" />
            </div>
          ) : pendingLeaves.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-12 gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-sage/10 border border-sage/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-sage-400" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">All caught up!</p>
              <p className="text-xs text-[var(--text-muted)]">No pending leave requests at the moment.</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {pendingLeaves.map((leave, i) => (
                  <PendingLeaveRow
                    key={leave.id}
                    leave={leave}
                    employeeName={getEmployeeName(leave.employee_id)}
                    avatar={getEmployeeAvatar(leave.employee_id)}
                    index={i}
                    onApprove={handleApprove}
                    onReject={(id) => { setRejectTarget(id); setRejectRemarks('') }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── CHARTS ROW ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department headcount */}
        <ChartCard title="Department Headcount" icon={Building2} accentColor="#A5AF79">
          {departments.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={departments}
                  dataKey="employee_count"
                  nameKey="department_name"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {departments.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(16px)',
                    fontSize: '12px',
                  }}
                  formatter={(v, name) => [`${v} employees`, name as string]}
                />
                <Legend formatter={(v) => <span className="text-xs text-[var(--text-secondary)]">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[var(--text-muted)] text-sm">
              {loading ? (
                <div className="w-6 h-6 rounded-full border-2 border-sage border-t-transparent animate-spin" />
              ) : 'No data available'}
            </div>
          )}
        </ChartCard>

        {/* Attendance trend */}
        <ChartCard title="Attendance Trend" icon={TrendingUp} accentColor="#E8A07C">
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trends} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8A07C" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E8A07C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(16px)',
                    fontSize: '12px',
                  }}
                  formatter={(v) => [`${(v as number).toFixed(1)}%`, 'Attendance Rate']}
                />
                <Area type="monotone" dataKey="attendance_rate" stroke="#E8A07C" fill="url(#attGrad2)" strokeWidth={2.5} dot={{ fill: '#E8A07C', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[var(--text-muted)] text-sm">
              {loading ? <div className="w-6 h-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" /> : 'No data available'}
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── PAYROLL TREND + ACTIVITY FEED ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll bar chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Monthly Payroll Cost" icon={DollarSign} accentColor="#827148">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trends} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={28}>
                  <defs>
                    <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E8A07C" />
                      <stop offset="100%" stopColor="#A5AF79" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `$${(v as number / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(16px)',
                      fontSize: '12px',
                    }}
                    formatter={v => [`$${((v as number) / 1000).toFixed(1)}k`, 'Payroll Cost']}
                  />
                  <Bar dataKey="payroll_cost" fill="url(#payGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[var(--text-muted)] text-sm">
                {loading ? <div className="w-6 h-6 rounded-full border-2 border-olive border-t-transparent animate-spin" /> : 'No data available'}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 28 }}
          className="relative overflow-hidden rounded-3xl border border-[var(--glass-border)]"
          style={{
            background: 'linear-gradient(160deg, var(--glass-bg) 0%, var(--surface) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 40px rgba(130,113,72,0.10), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-olive/10 blur-2xl pointer-events-none" />
          <div className="relative p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-olive/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-olive" />
              </div>
              <h3 className="font-black text-[var(--text-primary)]">Recent Activity</h3>
            </div>

            {activity.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                {loading ? 'Loading…' : 'No recent activity'}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                {activity.map((item, i) => {
                  const Icon = getActivityIcon(item.action)
                  const colorClass = getActivityColor(item.action)
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--surface)] transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug line-clamp-2">{item.description}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {item.user_email} · {timeAgo(item.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── QUICK STATS ROW ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Departments', value: stats?.total_departments ?? 0, icon: Building2, accent: '#A5AF79' },
          { label: 'Late Today', value: stats?.late_today ?? 0, icon: Clock, accent: '#E8A07C' },
          { label: 'Absent Today', value: stats?.absent_today ?? 0, icon: XCircle, accent: '#CC6030' },
          { label: 'Attendance %', value: Math.round(stats?.attendance_percentage_today ?? 0), icon: TrendingUp, suffix: '%', accent: '#827148' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.07, type: 'spring', stiffness: 280, damping: 28 }}
            className="relative overflow-hidden rounded-2xl border border-[var(--glass-border)] p-4"
            style={{
              background: `linear-gradient(135deg, ${s.accent}10 0%, var(--glass-bg) 100%)`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: `0 4px 20px ${s.accent}20, inset 0 1px 0 rgba(255,255,255,0.5)`,
            }}
          >
            <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full opacity-10 blur-xl pointer-events-none"
              style={{ background: s.accent }} />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.accent}20` }}>
              <span style={{ color: s.accent, display: 'flex' }}>
                <s.icon className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-black mt-0.5" style={{ color: s.accent }}>
              {s.value}{s.suffix ?? ''}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── REJECTION MODAL ────────────────────────────────────────────── */}
      <Modal
        isOpen={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectRemarks('') }}
        title="Reject Leave Request"
        footer={
          <>
            <button onClick={() => { setRejectTarget(null); setRejectRemarks('') }} className="btn-ghost">Cancel</button>
            <button
              onClick={handleRejectConfirm}
              disabled={!rejectRemarks.trim() || rejectProcessing}
              className="btn-danger"
            >
              {rejectProcessing ? 'Processing…' : 'Confirm Rejection'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Please provide a reason for rejecting this leave request. This will be visible to the employee.
          </p>
          <div>
            <label className="form-label flex items-center gap-1.5" htmlFor="reject-remarks-dashboard">
              Remarks
            </label>
            <textarea
              id="reject-remarks-dashboard"
              value={rejectRemarks}
              onChange={e => setRejectRemarks(e.target.value)}
              rows={3}
              placeholder="Enter rejection reason…"
              className="form-field resize-none"
            />
          </div>
        </div>
      </Modal>
    </HubDashboardLayout>
  )
}
