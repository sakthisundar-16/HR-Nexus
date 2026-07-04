import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { Toast } from '@/components/Toast'
import { useToast } from '@/hooks/useToast'

// We expose toast context via a simple singleton so pages can call it
export let globalToast: ReturnType<typeof useToast>['addToast'] = () => {}

export function AuthLayout() {
  const { toasts, addToast, removeToast } = useToast()
  globalToast = addToast
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors duration-300">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
