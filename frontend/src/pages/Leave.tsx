import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PlusCircle, Filter, Loader2, ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-react'
import { LeaveRequestForm } from '@/components/LeaveRequestForm'
import { LeaveApprovalCard } from '@/components/LeaveApprovalCard'
import { useAuth } from '@/hooks/useAuth'
import { leavesApi } from '@/api/leaves'
import { employeesApi } from '@/api/employees'
import type { LeaveRequest, LeaveBalance, Employee } from '@/types'
import { globalToast } from '@/layouts/AuthLayout'

export default function Leave() {
  const { role } = useAuth()
  const isAdmin = role === 'admin' || role === 'hr_manager'

  const [myLeaves, setMyLeaves]   = useState<LeaveRequest[]>([])
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([])
  const [balances, setBalances]   = useState<LeaveBalance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filter, setFilter]       = useState<string>('all')
  const [showForm, setShowForm]   = useState(false)
  const [loading, setLoading]     = useState(true)

  // --- Employee data fetch (own leaves + balance) ---
  const loadEmployee = useCallback(async () => {
    try {
      const leaves = await leavesApi.getMyLeaves()
      setMyLeaves(Array.isArray(leaves) ? leaves : [])
    } catch { /* silent */ }

    try {
      const bal = await leavesApi.getMyBalance()
      setBalances(Array.isArray(bal) ? bal : [])
    } catch { /* silent */ }
  }, [])

  // --- Admin data fetch (ALL employees' leaves + employee list) ---
  const loadAdmin = useCallback(async () => {
    try {
      const res = await leavesApi.getAllLeaves({ status: filter === 'all' ? undefined : filter })
      setAllLeaves(Array.isArray(res?.items) ? res.items : [])
    } catch {
      setAllLeaves([])
    }

    try {
      const empData = await employeesApi.getAll({ per_page: 100 })
      setEmployees(Array.isArray(empData?.items) ? empData.items : [])
    } catch {
      setEmployees([])
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    const fetches = isAdmin
      ? Promise.all([loadAdmin(), loadEmployee()])
      : loadEmployee()
    fetches.finally(() => setLoading(false))
  }, [isAdmin, filter, loadAdmin, loadEmployee])

  // --- Handlers ---
  const handleSubmitLeave = async (data: {
    leave_type: string
    start_date: string
    end_date: string
    reason: string
  }) => {
    try {
      const leave = await leavesApi.createLeave(data)
      setMyLeaves(prev => [leave, ...(Array.isArray(prev) ? prev : [])])
      setShowForm(false)
      globalToast('Leave request submitted! It will appear in the HR dashboard for approval.', 'success')
      await loadEmployee()
      if (isAdmin) await loadAdmin()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      globalToast(msg ?? 'Failed to submit leave request', 'error')
      throw e
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await leavesApi.reviewLeave(id, { status: 'approved' })
      globalToast('Leave approved ✓', 'success')
      await loadAdmin()
    } catch {
      globalToast('Failed to approve leave', 'error')
    }
  }

  const handleReject = async (id: string, remarks: string) => {
    try {
      await leavesApi.reviewLeave(id, { status: 'rejected', admin_remarks: remarks })
      globalToast('Leave rejected', 'info')
      await loadAdmin()
    } catch {
      globalToast('Failed to reject leave', 'error')
    }
  }

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId)
    return emp ? `${emp.first_name} ${emp.last_name}` : 'Employee'
  }

  // Always-safe filtered list
  const safeLeaves    = Array.isArray(allLeaves) ? allLeaves : []
  const filteredAdmin = filter === 'all' ? safeLeaves : safeLeaves.filter(l => l.status === filter)
  const pendingCount  = safeLeaves.filter(l => l.status === 'pending').length
  const approvedCount = safeLeaves.filter(l => l.status === 'approved').length
  const rejectedCount = safeLeaves.filter(l => l.status === 'rejected').length

  return (
    <div className="page-container space-y-6">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Leave Management</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {isAdmin
              ? 'Review and manage all employee leave requests'
              : 'Apply for leave and track your requests'}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowForm(s => !s)}
            className="btn-nexus flex items-center gap-2"
            id="apply-leave-btn"
          >
            <PlusCircle className="w-4 h-4" />
            {showForm ? 'Close Form' : 'Apply for Leave'}
          </button>
        )}
      </div>

      {/* ── Employee: Leave Balance Cards ──────────────────────── */}
      {!isAdmin && balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {balances.map(b => (
            <div key={b.leave_type} className="glass p-4 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 capitalize">
                {b.leave_type}
              </p>
              <p className="text-2xl font-black text-sage-500">{b.remaining_days}</p>
              <p className="text-[10px] text-[var(--text-muted)]">of {b.total_allowed} days</p>
              {b.pending_days > 0 && (
                <p className="text-[10px] text-terracotta font-semibold">{b.pending_days} pending</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Admin: Summary Stats ───────────────────────────────── */}
      {isAdmin && !loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending Review', value: pendingCount,  icon: Clock,        color: 'text-terracotta', bg: 'bg-terracotta/10' },
            { label: 'Approved',       value: approvedCount, icon: CheckCircle,  color: 'text-sage-500',   bg: 'bg-sage/10' },
            { label: 'Rejected',       value: rejectedCount, icon: XCircle,      color: 'text-[var(--text-muted)]', bg: 'bg-[var(--surface)]' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="glass-card flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] font-semibold">{label}</p>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Employee: Leave Request Form ───────────────────────── */}
      {!isAdmin && showForm && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <LeaveRequestForm balances={balances} onSubmit={handleSubmitLeave} />
        </motion.div>
      )}

      {/* ── Admin: Filter Tabs + Approval Cards ───────────────── */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                  filter === f ? 'bg-terracotta text-white shadow-nexus' : 'btn-ghost'
                }`}
              >
                {f}
                {f === 'pending' && pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-[10px]">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
            </div>
          ) : filteredAdmin.length === 0 ? (
            <div className="glass-card text-center py-16">
              <ClipboardList className="w-10 h-10 mx-auto text-terracotta/30 mb-3" />
              <p className="font-semibold text-[var(--text-muted)]">No leave requests found</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {filter === 'pending'
                  ? 'All pending requests have been reviewed.'
                  : `No ${filter} leave requests.`}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAdmin.map((leave, i) => (
                <LeaveApprovalCard
                  key={leave.id}
                  leave={leave}
                  employeeName={getEmployeeName(leave.employee_id)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  showActions={leave.status === 'pending'}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Employee: Own Leave History ────────────────────────── */}
      {!isAdmin && (
        <div className="space-y-4">
          <h2 className="font-bold text-[var(--text-primary)]">My Leave History</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-terracotta" />
            </div>
          ) : myLeaves.length === 0 ? (
            <div className="glass-card text-center py-8 text-[var(--text-muted)] text-sm">
              No leave requests yet
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {myLeaves.map((leave, i) => (
                <LeaveApprovalCard
                  key={leave.id}
                  leave={leave}
                  showActions={false}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
