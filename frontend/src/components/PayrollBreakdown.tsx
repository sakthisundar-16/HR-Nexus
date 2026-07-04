import React from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import type { PayrollRecord } from '@/types'

interface PayrollBreakdownProps {
  record: PayrollRecord
  history?: PayrollRecord[]
  onDownload?: (record: PayrollRecord) => void
}

const COLORS = ['#E8A07C', '#A5AF79', '#827148']

function generateCSV(record: PayrollRecord): string {
  const rows = [
    ['Pay Period', record.payroll_period],
    ['Employee ID', record.employee_id],
    ['Base Salary', record.base_salary.toFixed(2)],
    ['Allowances', record.allowances.toFixed(2)],
    ['Overtime Pay', record.overtime_pay.toFixed(2)],
    ['Gross Salary', record.gross_salary.toFixed(2)],
    ['Tax', record.tax.toFixed(2)],
    ['Deductions', record.deductions.toFixed(2)],
    ['Net Salary', record.net_salary.toFixed(2)],
    ['Status', record.status],
    ['Payment Date', record.payment_date ?? '—'],
    ['Days Present', record.days_present],
    ['Days Absent', record.days_absent],
  ]
  return rows.map(r => r.join(',')).join('\n')
}

export function PayrollBreakdown({ record, history = [], onDownload }: PayrollBreakdownProps) {
  const pieData = [
    { name: 'Tax', value: record.tax },
    { name: 'Deductions', value: record.deductions },
    { name: 'Net Pay', value: record.net_salary },
  ]

  const barData = [...history].reverse().slice(0, 6).map(r => ({
    period: r.payroll_period,
    'Net Salary': r.net_salary,
    'Gross Salary': r.gross_salary,
  }))

  const handleDownload = () => {
    if (onDownload) { onDownload(record); return }
    const csv = generateCSV(record)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payslip-${record.payroll_period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Gross Salary', value: `$${record.gross_salary.toLocaleString('en', { minimumFractionDigits: 2 })}`, color: 'text-terracotta-400' },
          { label: 'Tax', value: `$${record.tax.toLocaleString('en', { minimumFractionDigits: 2 })}`, color: 'text-red-500' },
          { label: 'Deductions', value: `$${record.deductions.toLocaleString('en', { minimumFractionDigits: 2 })}`, color: 'text-olive' },
          { label: 'Net Salary', value: `$${record.net_salary.toLocaleString('en', { minimumFractionDigits: 2 })}`, color: 'text-sage-500 text-xl font-black' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass p-4 rounded-2xl text-center">
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">{label}</p>
            <p className={`font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="glass-card">
          <h4 className="font-bold text-sm text-[var(--text-primary)] mb-4">Salary Breakdown</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={((v: unknown) => [`$${(v as number).toFixed(2)}`, '']) as never} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        {barData.length > 1 && (
          <div className="glass-card">
            <h4 className="font-bold text-sm text-[var(--text-primary)] mb-4">6-Month Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip formatter={((v: unknown) => [`$${(v as number).toFixed(2)}`, '']) as never} />
                <Bar dataKey="Net Salary" fill="#A5AF79" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gross Salary" fill="#E8A07C" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Download */}
      <div className="flex justify-end">
        <button
          onClick={handleDownload}
          className="btn-ghost gap-2"
          id="download-payslip-btn"
        >
          <Download className="w-4 h-4" />
          Download CSV Payslip
        </button>
      </div>
    </div>
  )
}

export { generateCSV }
