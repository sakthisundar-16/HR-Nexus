import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Loader2, Hexagon, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPwd, setShowPwd] = useState(false)
  const [serverError, setServerError] = useState('')
  const from = (location.state as { from?: string })?.from

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const emailValue = watch('email')
  const passwordValue = watch('password')

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      await signIn(data.email, data.password)
      // Navigate based on role
      const userStr = localStorage.getItem('hr_nexus:user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const dest = (user.role === 'admin' || user.role === 'hr_manager')
          ? '/dashboard/admin'
          : '/dashboard/employee'
        navigate(from ?? dest, { replace: true })
      }
    } catch {
      setServerError('Invalid email or password. Please try again.')
    }
  }

  const handleAutofill = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', pass, { shouldValidate: true })
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-terracotta/10 blur-3xl -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] rounded-full bg-sage/10 blur-3xl translate-y-1/3 -translate-x-1/3" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="glass-card !p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-terracotta to-olive flex items-center justify-center shadow-nexus-lg mb-4"
            >
              <Hexagon className="w-9 h-9 text-white" fill="rgba(255,255,255,0.2)" />
            </motion.div>
            <h1 className="text-2xl font-black gradient-text">HR NEXUS</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Enterprise Human Resource Management</p>
          </div>

          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Welcome back</h2>

          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            >
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{serverError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="relative">
                {!emailValue && (
                  <Mail className="absolute left-3.5 top-0 bottom-0 my-auto w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                )}
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register('email')}
                  className="form-field form-field-icon-left"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <div className="relative">
                {!passwordValue && (
                  <Lock className="absolute left-3.5 top-0 bottom-0 my-auto w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                )}
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="form-field form-field-icon-left form-field-icon-right"
                  aria-describedby={errors.password ? 'pwd-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-2 top-0 bottom-0 my-auto w-8 h-8 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center cursor-pointer"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="pwd-error" className="form-error">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              id="sign-in-btn"
              disabled={isSubmitting}
              className="btn-nexus w-full mt-2"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Don't have an account?{' '}
            <Link to="/sign-up" className="text-terracotta font-semibold hover:underline">
              Sign up
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-[var(--border)]">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Quick Login (Demo)</p>
            <div className="flex flex-col gap-2">
              {[
                { role: 'Admin', email: 'admin@hrnexus.com', pwd: 'nJgi0ITbrY9GMsNOFntdS8A5mOipPq/3o2aEYnclkEw=' },
                { role: 'HR Manager', email: 'hr@hrnexus.com', pwd: 'Hr@123456' },
                { role: 'Employee', email: 'alex.chen@hrnexus.com', pwd: 'Employee@123' },
              ].map(c => (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => handleAutofill(c.email, c.pwd)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--surface)] hover:bg-terracotta/10 border border-[var(--border)] hover:border-terracotta/30 text-xs font-medium transition-all group text-left cursor-pointer w-full"
                >
                  <div>
                    <span className="font-bold text-terracotta group-hover:text-terracotta-400 transition-colors">
                      Login as {c.role}
                    </span>
                    <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">{c.email}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg)] px-2 py-1 rounded-md border border-[var(--border)] group-hover:border-terracotta/20 transition-all">
                    Autofill →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
