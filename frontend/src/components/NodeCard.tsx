import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export interface NodeCardProps {
  module: 'profile' | 'attendance' | 'leave' | 'payroll' | 'employees'
  label: string
  icon: LucideIcon
  route: string
  summary?: string
  index?: number
}

const moduleGradients: Record<string, string> = {
  profile:    'from-terracotta to-olive',
  attendance: 'from-sage to-olive',
  leave:      'from-olive to-terracotta',
  payroll:    'from-terracotta to-sage',
  employees:  'from-sage to-terracotta',
}

export function NodeCard({ module, label, icon: Icon, route, summary, index = 0 }: NodeCardProps) {
  const gradient = moduleGradients[module] ?? 'from-terracotta to-olive'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 260, damping: 25 }}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="node-card"
      id={`node-card-${module}`}
    >
      <Link to={route} className="block h-full">
        <div className="glass-card h-full flex flex-col gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-nexus flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-bold text-base text-[var(--text-primary)] mb-1">{label}</h3>
            {summary && (
              <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-2">{summary}</p>
            )}
          </div>

          {/* Indicator */}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradient} animate-pulse-soft`} />
            <span className="text-xs font-semibold text-[var(--text-muted)]">View →</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
