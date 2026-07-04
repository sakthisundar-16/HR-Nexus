// ─── Auth ────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'hr_manager' | 'employee'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  is_active: boolean
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface LoginRequest {
  email: string
  password: string
}

// ─── Employee ────────────────────────────────────────────────────
export type EmploymentStatus = 'active' | 'on_leave' | 'terminated' | 'probation'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export interface Department {
  id: string
  name: string
  code: string
  description?: string
  manager_id?: string
  employee_count?: number
  active_employee_count?: number
  average_salary?: number
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  user_id: string
  employee_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: Gender
  address?: string
  city?: string
  state?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  job_title?: string
  profile_picture_url?: string
  department_id?: string | null
  department?: Department
  user?: UserProfile
  hire_date: string
  employment_status: EmploymentStatus
  base_salary: number
  profile_completion_pct: number
  created_at: string
  updated_at: string
}

export interface EmployeeSelfUpdate {
  phone?: string
  date_of_birth?: string
  gender?: Gender
  address?: string
  city?: string
  state?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  profile_picture_url?: string
}

export interface EmployeeAdminUpdate extends EmployeeSelfUpdate {
  first_name?: string
  last_name?: string
  job_title?: string
  department_id?: string | null
  hire_date?: string
  employment_status?: EmploymentStatus
  base_salary?: number
}

export interface EmployeeCreate {
  first_name: string
  last_name: string
  email: string
  password: string
  role?: UserRole
  department_id?: string
  hire_date?: string
  employment_status?: EmploymentStatus
  base_salary?: number
  job_title?: string
  phone?: string
}

// ─── Attendance ──────────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'late' | 'on_leave'

export interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  check_in?: string
  check_out?: string
  total_hours?: number
  status: AttendanceStatus
  notes?: string
  check_in_ip?: string
  created_at: string
  updated_at: string
}

export interface AttendanceSummary {
  total_days_recorded: number
  days_present: number
  days_absent: number
  days_half_day: number
  days_late: number
  days_on_leave: number
  total_working_hours: number
  average_working_hours: number
  attendance_percentage: number
}

// ─── Leave ───────────────────────────────────────────────────────
export type LeaveType = 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveRequest {
  id: string
  employee_id: string
  approved_by?: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: LeaveStatus
  admin_remarks?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface LeaveBalance {
  leave_type: string
  total_allowed: number
  used_days: number
  pending_days: number
  remaining_days: number
}

export interface LeaveReview {
  status: 'approved' | 'rejected'
  admin_remarks?: string
}

// ─── Payroll ─────────────────────────────────────────────────────
export type PayrollStatus = 'draft' | 'processed' | 'paid'

export interface PayrollRecord {
  id: string
  employee_id: string
  payroll_period: string
  base_salary: number
  allowances: number
  deductions: number
  overtime_pay: number
  gross_salary: number
  tax: number
  net_salary: number
  working_days: number
  days_present: number
  days_absent: number
  status: PayrollStatus
  payment_date?: string
  created_at: string
  updated_at: string
}

export interface PayrollGenerate {
  employee_id: string
  payroll_period: string
  allowances?: number
  deductions?: number
  overtime_pay?: number
}

// ─── Analytics ───────────────────────────────────────────────────
export interface DashboardStats {
  total_employees: number
  active_employees: number
  on_leave_today: number
  total_departments: number
  present_today: number
  absent_today: number
  late_today: number
  attendance_percentage_today: number
  monthly_payroll_cost: number
  pending_leave_requests: number
}

export interface DepartmentDistributionItem {
  department_name: string
  department_code: string
  employee_count: number
  percentage: number
}

export interface MonthlyTrendItem {
  month: string
  attendance_rate: number
  payroll_cost: number
  new_hires: number
  total_employees: number
}

export interface LeaveStatItem {
  category: string
  count: number
  percentage: number
}

export interface ActivityItem {
  id: string
  timestamp: string
  action: string
  entity_type: string
  description: string
  user_email?: string
  metadata?: Record<string, unknown>
}

// ─── Notification ────────────────────────────────────────────────
export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// ─── API Envelope ────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  meta?: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
  timestamp: string
}

export interface ApiError {
  success: false
  message: string
  error_code?: string
  details?: Record<string, unknown>
  timestamp: string
}
