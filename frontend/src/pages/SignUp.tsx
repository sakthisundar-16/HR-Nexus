import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Loader2, Hexagon, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['employee', 'admin']),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function SignUp() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'employee' },
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      // HR Nexus backend doesn't have a public register endpoint;
      // admins create employees. Show helpful message.
      setServerError('Self-registration is not enabled. Please contact your HR administrator to create your account.')
    } catch {
      setServerError('Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-sage/10 blur-3xl -translate-y-1/3 -translate-x-1/3" />
      <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] rounded-full bg-terracotta/10 blur-3xl translate-y-1/3 translate-x-1/3" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="glass-card !p-8">
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage to-olive flex items-center justify-center shadow-nexus-lg mb-4"
            >
              <Hexagon className="w-9 h-9 text-white" fill="rgba(255,255,255,0.2)" />
            </motion.div>
            <h1 className="text-2xl font-black gradient-text">HR NEXUS</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Create your account</p>
          </div>

          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/20"
            >
              <p className="text-sm text-terracotta-400 font-medium">{serverError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="form-label" htmlFor="email">
                <Mail className="w-3.5 h-3.5 inline mr-1" />Email Address
              </label>
              <input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} className="form-field" />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label" htmlFor="password">
                <Lock className="w-3.5 h-3.5 inline mr-1" />Password
              </label>
              <div className="relative">
                <input id="password" type={showPwd ? 'text' : 'password'} autoComplete="new-password" placeholder="Min. 8 characters" {...register('password')} className="form-field pr-10" />
                <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div>
              <label className="form-label" htmlFor="confirmPassword">
                <Lock className="w-3.5 h-3.5 inline mr-1" />Confirm Password
              </label>
              <input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat password" {...register('confirmPassword')} className="form-field" />
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <label className="form-label" htmlFor="role">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />Role
              </label>
              <select id="role" {...register('role')} className="form-field">
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p className="form-error">{errors.role.message}</p>}
            </div>

            <button type="submit" id="sign-up-btn" disabled={isSubmitting} className="btn-nexus w-full mt-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-terracotta font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
