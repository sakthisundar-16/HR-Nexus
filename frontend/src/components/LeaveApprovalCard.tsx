import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Calendar, User, MessageSquare } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { Modal } from './Modal'
import type { LeaveRequest } from '@/types'

interface LeaveApprovalCardProps {
  leave: LeaveRequest
  employeeName?: string
  onApprove?: (id: string) => void
  onReject?: (id: string, remarks: string) => void
  showActions?: boolean
  index?: number
}

export function LeaveApprovalCard({ leave, employeeName, onApprove, onReject, showActions = false, index = 0 }: LeaveApprovalCardProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const duration = (() => {
    const start = new Date(leave.start_date)
    const end = new Date(leave.end_date)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  })()

  const handleApprove = async () => {
    setIsProcessing(true)
    try { await onApprove?.(leave.id) } finally { setIsProcessing(false) }
  }

  const handleReject = async () => {
    if (!remarks.trim()) return
    setIsProcessing(true)
    try {
      await onReject?.(leave.id, remarks)
      setRejectOpen(false)
      setRemarks('')
    } finally { setIsProcessing(false) }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="glass-card"
        id={`leave-card-${leave.id}`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-olive to-terracotta flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(employeeName ?? 'U')[0]}
            </div>
            <div>
              <p className="font-bold text-sm text-[var(--text-primary)]">{employeeName ?? 'Employee'}</p>
              <p className="text-xs text-[var(--text-muted)] capitalize">{leave.leave_type} Leave</p>
            </div>
          </div>
          <StatusBadge status={leave.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Calendar className="w-4 h-4 text-terracotta flex-shrink-0" />
            <div>
              <p className="text-xs text-[var(--text-muted)]">Period</p>
              <p className="font-semibold">{leave.start_date} – {leave.end_date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <User className="w-4 h-4 text-sage flex-shrink-0" />
            <div>
              <p className="text-xs text-[var(--text-muted)]">Duration</p>
              <p className="font-semibold">{duration} day{duration !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {leave.reason && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--surface)] mb-4">
            <MessageSquare className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{leave.reason}</p>
          </div>
        )}

        {leave.admin_remarks && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50/60 dark:bg-red-900/10 mb-4">
            <MessageSquare className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{leave.admin_remarks}</p>
          </div>
        )}

        {showActions && leave.status === 'pending' && (
          <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="btn-sage flex-1 text-sm"
              id={`approve-leave-${leave.id}`}
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button
              onClick={() => setRejectOpen(true)}
              disabled={isProcessing}
              className="btn-danger flex-1 text-sm"
              id={`reject-leave-${leave.id}`}
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        )}
      </motion.div>

      {/* Rejection modal */}
      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject Leave Request"
        footer={
          <>
            <button onClick={() => setRejectOpen(false)} className="btn-ghost">Cancel</button>
            <button
              onClick={handleReject}
              disabled={!remarks.trim() || isProcessing}
              className="btn-danger"
            >
              Confirm Rejection
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Please provide a reason for rejecting this leave request.
          </p>
          <div>
            <label className="form-label" htmlFor="reject-remarks">Remarks</label>
            <textarea
              id="reject-remarks"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={3}
              placeholder="Enter rejection reason…"
              className="form-field resize-none"
            />
          </div>
        </div>
      </Modal>
    </>
  )
}
