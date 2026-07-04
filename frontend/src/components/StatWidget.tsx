import React from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'

interface StatWidgetProps {
  label: string
  value: number
  icon?: LucideIcon
  color?: 'terracotta' | 'sage' | 'olive' | 'cream'
  suffix?: string
  prefix?: string
  index?: number
}

const colorMap = {
  terracotta: {
    gradient: 'from-terracotta/20 to-terracotta/5',
    icon: 'bg-gradient-to-br from-terracotta to-terracotta-400',
    value: 'text-terracotta-400',
    border: 'border-terracotta/20',
  },
  sage: {
    gradient: 'from-sage/20 to-sage/5',
    icon: 'bg-gradient-to-br from-sage to-sage-400',
    value: 'text-sage-500',
    border: 'border-sage/20',
  },
  olive: {
    gradient: 'from-olive/20 to-olive/5',
    icon: 'bg-gradient-to-br from-olive to-olive-400',
    value: 'text-olive',
    border: 'border-olive/20',
  },
  cream: {
    gradient: 'from-cream/80 to-cream/40',
    icon: 'bg-gradient-to-br from-olive to-terracotta',
    value: 'text-olive',
    border: 'border-olive/10',
  },
}

export function StatWidget({ label, value, icon: Icon, color = 'terracotta', suffix = '', prefix = '', index = 0 }: StatWidgetProps) {
  const animatedValue = useCountUp(value)
  const colors = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 280, damping: 28 }}
      className={`glass-card border ${colors.border} bg-gradient-to-br ${colors.gradient}`}
      id={`stat-widget-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${colors.icon} flex items-center justify-center shadow-nexus flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider truncate">{label}</p>
          <p className={`text-2xl font-black mt-0.5 ${colors.value}`}>
            {prefix}<motion.span>{animatedValue}</motion.span>{suffix}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
