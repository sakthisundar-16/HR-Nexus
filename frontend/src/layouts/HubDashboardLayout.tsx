import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Hexagon } from 'lucide-react'
import { NodeCard, type NodeCardProps } from '@/components/NodeCard'
import { StatWidget } from '@/components/StatWidget'
import type { LucideIcon } from 'lucide-react'

interface StatWidgetConfig {
  label: string
  value: number
  icon?: LucideIcon
  color?: 'terracotta' | 'sage' | 'olive' | 'cream'
  suffix?: string
  prefix?: string
}

interface HubDashboardLayoutProps {
  nodes: NodeCardProps[]
  greeting: string
  subtitle?: string
  statWidgets: StatWidgetConfig[]
  children?: React.ReactNode
}

export function HubDashboardLayout({ nodes, greeting, subtitle, statWidgets, children }: HubDashboardLayoutProps) {
  return (
    <div className="page-container space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-black text-[var(--text-primary)]">{greeting}</h1>
        {subtitle && <p className="text-[var(--text-muted)] mt-1 font-medium">{subtitle}</p>}
      </motion.div>

      {/* Stat widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statWidgets.map((w, i) => (
          <StatWidget key={w.label} {...w} index={i} />
        ))}
      </div>

      {/* Hub + Nodes */}
      <HubCanvas nodes={nodes} />

      {/* Additional content */}
      {children && <div className="space-y-6">{children}</div>}
    </div>
  )
}

function HubCanvas({ nodes }: { nodes: NodeCardProps[] }) {
  const hubRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile) return
    const update = () => {
      const container = containerRef.current
      const hub = hubRef.current
      if (!container || !hub) return
      const cRect = container.getBoundingClientRect()
      const hRect = hub.getBoundingClientRect()
      const hubCx = hRect.left - cRect.left + hRect.width / 2
      const hubCy = hRect.top - cRect.top + hRect.height / 2

      const newLines = cardRefs.current.map(card => {
        if (!card) return null
        const r = card.getBoundingClientRect()
        return {
          x1: hubCx,
          y1: hubCy,
          x2: r.left - cRect.left + r.width / 2,
          y2: r.top - cRect.top + r.height / 2,
        }
      }).filter(Boolean) as { x1: number; y1: number; x2: number; y2: number }[]

      setLines(newLines)
    }

    const observer = new ResizeObserver(update)
    if (containerRef.current) observer.observe(containerRef.current)
    update()
    return () => observer.disconnect()
  }, [isMobile, nodes.length])

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {nodes.map((node, i) => (
          <div key={node.module} ref={el => { cardRefs.current[i] = el }}>
            <NodeCard {...node} index={i} />
          </div>
        ))}
      </div>
    )
  }

  // Desktop: asymmetric hub layout
  const topNodes = nodes.slice(0, Math.ceil(nodes.length / 2))
  const bottomNodes = nodes.slice(Math.ceil(nodes.length / 2))

  return (
    <div ref={containerRef} className="relative">
      {/* SVG connector lines */}
      <svg
        className="absolute inset-0 pointer-events-none z-0"
        style={{ width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        {lines.map((l, i) => (
          <motion.line
            key={i}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            className="hub-connector"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: i * 0.15 + 0.3, duration: 0.6 }}
          />
        ))}
        {/* Animated circle along each line */}
        {lines.map((l, i) => (
          <motion.circle
            key={`dot-${i}`}
            r={3}
            fill="#E8A07C"
            opacity={0.7}
            initial={{ offsetDistance: '0%' }}
            animate={{ offsetDistance: '100%' }}
            style={{
              offsetPath: `path('M ${l.x1} ${l.y1} L ${l.x2} ${l.y2}')`,
            }}
          />
        ))}
      </svg>

      {/* Top row of nodes */}
      <div className="grid gap-4 mb-8 relative z-10" style={{ gridTemplateColumns: `repeat(${topNodes.length}, 1fr)` }}>
        {topNodes.map((node, i) => (
          <div key={node.module} ref={el => { cardRefs.current[i] = el }}>
            <NodeCard {...node} index={i} />
          </div>
        ))}
      </div>

      {/* Hub centre */}
      <div className="flex justify-center mb-8 relative z-10">
        <motion.div
          ref={hubRef}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-terracotta via-olive to-sage shadow-nexus-lg flex items-center justify-center">
            <Hexagon className="w-12 h-12 text-white drop-shadow-lg" fill="rgba(255,255,255,0.15)" />
          </div>
          {/* Orbit rings */}
          <div className="absolute inset-0 rounded-full border-2 border-terracotta/20 animate-spin-slow" />
          <div className="absolute -inset-3 rounded-full border border-terracotta/10 animate-[spin_12s_linear_infinite_reverse]" />
        </motion.div>
      </div>

      {/* Bottom row of nodes */}
      {bottomNodes.length > 0 && (
        <div className="grid gap-4 relative z-10" style={{ gridTemplateColumns: `repeat(${bottomNodes.length}, 1fr)` }}>
          {bottomNodes.map((node, i) => (
            <div key={node.module} ref={el => { cardRefs.current[topNodes.length + i] = el }}>
              <NodeCard {...node} index={topNodes.length + i} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
