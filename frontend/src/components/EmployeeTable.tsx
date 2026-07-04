import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronUp, ChevronDown, Eye, ArrowLeftRight } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import type { Employee } from '@/types'

interface EmployeeTableProps {
  employees: Employee[]
  onViewProfile: (id: string) => void
  onSwitchContext?: (id: string) => void
  showSwitchContext?: boolean
  isLoading?: boolean
}

type SortField = 'fullName' | 'department' | 'jobTitle' | 'status'
type SortDir = 'asc' | 'desc'

export function filterEmployees(employees: Employee[], query: string): Employee[] {
  const q = query.toLowerCase().trim()
  if (!q) return employees
  return employees.filter(e => {
    const fullName = `${e.first_name} ${e.last_name}`.toLowerCase()
    return (
      fullName.includes(q) ||
      (e.department?.name ?? '').toLowerCase().includes(q) ||
      (e.job_title ?? '').toLowerCase().includes(q) ||
      (e.employee_id ?? '').toLowerCase().includes(q)
    )
  })
}

export function EmployeeTable({ employees, onViewProfile, onSwitchContext, showSwitchContext = false, isLoading }: EmployeeTableProps) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('fullName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const perPage = 10

  const filtered = useMemo(() => filterEmployees(employees, search), [employees, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA = '', valB = ''
      if (sortField === 'fullName') { valA = `${a.first_name} ${a.last_name}`; valB = `${b.first_name} ${b.last_name}` }
      else if (sortField === 'department') { valA = a.department?.name ?? ''; valB = b.department?.name ?? '' }
      else if (sortField === 'jobTitle') { valA = a.job_title ?? ''; valB = b.job_title ?? '' }
      else if (sortField === 'status') { valA = a.employment_status; valB = b.employment_status }
      const cmp = valA.localeCompare(valB)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  const paginated = useMemo(() => sorted.slice((page - 1) * perPage, page * perPage), [sorted, page])
  const totalPages = Math.ceil(sorted.length / perPage)

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setPage(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3.5 h-3.5 opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-terracotta" />
      : <ChevronDown className="w-3.5 h-3.5 text-terracotta" />
  }

  return (
    <div className="glass-card !p-0 overflow-hidden">
      {/* Search */}
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <div className="relative max-w-sm">
          {!search && (
            <Search className="absolute left-3.5 top-0 bottom-0 my-auto w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          )}
          <input
            id="employee-search"
            type="search"
            placeholder="Search employees…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="form-field form-field-icon-left"
            aria-label="Search employees"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid" aria-label="Employee list">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {[
                { label: 'Employee', field: 'fullName' as SortField },
                { label: 'Department', field: 'department' as SortField },
                { label: 'Job Title', field: 'jobTitle' as SortField },
                { label: 'Status', field: 'status' as SortField },
              ].map(col => (
                <th
                  key={col.field}
                  className="px-6 py-3.5 text-left font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors"
                  onClick={() => toggleSort(col.field)}
                  aria-sort={sortField === col.field ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    <SortIcon field={col.field} />
                  </div>
                </th>
              ))}
              <th className="px-6 py-3.5 text-right font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 rounded bg-[var(--surface)] animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">
                  No employees found
                </td>
              </tr>
            ) : (
              paginated.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-terracotta to-olive flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{emp.employee_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{emp.department?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{emp.job_title ?? '—'}</td>
                  <td className="px-6 py-4"><StatusBadge status={emp.employment_status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewProfile(emp.id)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-terracotta hover:bg-terracotta/10 transition-all"
                        aria-label={`View profile of ${emp.first_name}`}
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {showSwitchContext && onSwitchContext && (
                        <button
                          onClick={() => onSwitchContext(emp.id)}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-sage hover:bg-sage/10 transition-all"
                          aria-label={`Switch context to ${emp.first_name}`}
                          title="Switch Context"
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <p className="text-sm text-[var(--text-muted)]">
            {(page - 1) * perPage + 1}–{Math.min(page * perPage, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                  p === page
                    ? 'bg-terracotta text-white shadow-nexus'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
