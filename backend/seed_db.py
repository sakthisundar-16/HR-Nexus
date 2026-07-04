"""
HR Nexus — Database Seeder Script

Populates the database with realistic sample data for demo & hackathon evaluation.
Includes:
- Admin account and HR Manager account
- 5 Sample Departments (Engineering, Product, HR, Sales, Finance)
- 10 Realistic Employees with different roles, salaries, and profiles
- Attendance records for the past 14 days (present, late, half day, absent)
- Leave requests across various statuses (approved, pending, rejected)
- Payroll records for the previous month (auto-computed)
- Sample notifications and audit logs
"""

import asyncio
import logging
from datetime import date, datetime, timedelta, timezone
import random
import sys
import os

# Add parent directory to path so imports work when running directly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import get_settings
from app.core.constants import (
    AttendanceStatus,
    EmploymentStatus,
    Gender,
    LeaveStatus,
    LeaveType,
    NotificationType,
    PayrollStatus,
    UserRole,
)
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal, create_tables
from app.models import (
    Attendance,
    AuditLog,
    Department,
    Employee,
    LeaveRequest,
    Notification,
    Payroll,
    User,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seeder")
settings = get_settings()


async def seed_database():
    """Run the database seeding process."""
    logger.info("Initializing database tables...")
    await create_tables()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select
        existing_users = (await db.execute(select(User))).scalars().first()
        if existing_users:
            logger.warning("Database already contains data! Skipping seeding to prevent duplicates.")
            return

        logger.info("Seeding Departments...")
        departments_data = [
            {"name": "Engineering", "code": "ENG", "description": "Software Development & Infrastructure"},
            {"name": "Product Management", "code": "PROD", "description": "Product Strategy & UX"},
            {"name": "Human Resources", "code": "HR", "description": "People Operations & Talent"},
            {"name": "Sales & Marketing", "code": "SALES", "description": "Revenue & Growth"},
            {"name": "Finance & Legal", "code": "FIN", "description": "Accounting & Legal Compliance"},
        ]
        departments = {}
        for d_data in departments_data:
            dept = Department(**d_data)
            db.add(dept)
            await db.flush()
            departments[dept.code] = dept
        logger.info("Created %d departments.", len(departments))

        logger.info("Seeding Users & Employees...")
        
        # 1. Admin User & Profile
        admin_user = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            role=UserRole.ADMIN.value,
            is_active=True,
            last_login=datetime.now(timezone.utc) - timedelta(hours=2),
        )
        db.add(admin_user)
        await db.flush()

        admin_emp = Employee(
            user_id=admin_user.id,
            department_id=departments["HR"].id,
            employee_id="EMP-0001",
            first_name="Sivan",
            last_name="Administrator",
            phone="+1-555-0101",
            date_of_birth=date(1988, 5, 12),
            gender=Gender.MALE.value,
            address="100 Enterprise Blvd, Suite 400",
            city="San Francisco",
            state="CA",
            emergency_contact_name="Sarah Administrator",
            emergency_contact_phone="+1-555-0102",
            hire_date=date(2022, 1, 15),
            employment_status=EmploymentStatus.ACTIVE.value,
            job_title="VP of People & Operations",
            base_salary=150000.00,
            profile_picture_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
            profile_completion_pct=100,
        )
        db.add(admin_emp)
        await db.flush()

        # 2. HR Manager
        hr_user = User(
            email="hr@hrnexus.com",
            hashed_password=hash_password("Hr@123456"),
            role=UserRole.HR_MANAGER.value,
            is_active=True,
        )
        db.add(hr_user)
        await db.flush()

        hr_emp = Employee(
            user_id=hr_user.id,
            department_id=departments["HR"].id,
            employee_id="EMP-0002",
            first_name="Elena",
            last_name="Rostova",
            phone="+1-555-0201",
            date_of_birth=date(1992, 8, 24),
            gender=Gender.FEMALE.value,
            address="456 Market St",
            city="San Francisco",
            state="CA",
            hire_date=date(2023, 3, 1),
            employment_status=EmploymentStatus.ACTIVE.value,
            job_title="Senior HR Specialist",
            base_salary=95000.00,
            profile_picture_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
            profile_completion_pct=80,
        )
        db.add(hr_emp)
        await db.flush()

        # 3-10. Regular Employees across departments
        employees_seed_data = [
            ("alex.chen@hrnexus.com", "Alex", "Chen", "ENG", "Principal Systems Architect", 165000.00, Gender.MALE, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"),
            ("marcus.vance@hrnexus.com", "Marcus", "Vance", "ENG", "Senior Backend Engineer", 135000.00, Gender.MALE, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"),
            ("chloe.bennett@hrnexus.com", "Chloe", "Bennett", "ENG", "Frontend React Developer", 115000.00, Gender.FEMALE, "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400"),
            ("david.kim@hrnexus.com", "David", "Kim", "PROD", "Director of Product", 155000.00, Gender.MALE, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"),
            ("priya.patel@hrnexus.com", "Priya", "Patel", "PROD", "UI/UX Product Designer", 110000.00, Gender.FEMALE, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"),
            ("james.wilson@hrnexus.com", "James", "Wilson", "SALES", "Account Executive", 90000.00, Gender.MALE, "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400"),
            ("sophia.martinez@hrnexus.com", "Sophia", "Martinez", "SALES", "Growth Marketing Manager", 105000.00, Gender.FEMALE, "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400"),
            ("lucas.taylor@hrnexus.com", "Lucas", "Taylor", "FIN", "Financial Analyst", 98000.00, Gender.MALE, "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400"),
        ]

        all_employees = [admin_emp, hr_emp]
        for idx, (email, fname, lname, dept_code, title, salary, gender, pic) in enumerate(employees_seed_data, start=3):
            u = User(
                email=email,
                hashed_password=hash_password("Employee@123"),
                role=UserRole.EMPLOYEE.value,
                is_active=True,
            )
            db.add(u)
            await db.flush()

            emp = Employee(
                user_id=u.id,
                department_id=departments[dept_code].id,
                employee_id=f"EMP-{idx:04d}",
                first_name=fname,
                last_name=lname,
                phone=f"+1-555-03{idx:02d}",
                date_of_birth=date(1990 + (idx % 8), (idx % 12) + 1, 10 + idx),
                gender=gender.value,
                address=f"{100 + idx * 15} Innovation Way",
                city="San Francisco",
                state="CA",
                hire_date=date(2023, (idx % 12) + 1, 1),
                employment_status=EmploymentStatus.ACTIVE.value,
                job_title=title,
                base_salary=salary,
                profile_picture_url=pic,
                profile_completion_pct=70 + (idx * 3) % 30,
            )
            db.add(emp)
            await db.flush()
            all_employees.append(emp)

        logger.info("Created %d employees.", len(all_employees))

        logger.info("Seeding Attendance Records (Past 14 Days)...")
        today = date.today()
        attendance_count = 0
        for emp in all_employees:
            for day_offset in range(1, 15):
                record_date = today - timedelta(days=day_offset)
                # Skip weekends
                if record_date.weekday() >= 5:
                    continue

                # Simulate different attendance behaviors
                rand_val = random.random()
                if rand_val < 0.80:
                    # Present on time
                    check_in_time = datetime.combine(record_date, datetime.min.time(), timezone.utc) + timedelta(hours=9, minutes=random.randint(0, 25))
                    check_out_time = check_in_time + timedelta(hours=8, minutes=random.randint(0, 45))
                    status = AttendanceStatus.PRESENT.value
                    hours = (check_out_time - check_in_time).total_seconds() / 3600.0
                elif rand_val < 0.90:
                    # Late check-in
                    check_in_time = datetime.combine(record_date, datetime.min.time(), timezone.utc) + timedelta(hours=9, minutes=random.randint(35, 59))
                    check_out_time = check_in_time + timedelta(hours=8)
                    status = AttendanceStatus.LATE.value
                    hours = 8.0
                elif rand_val < 0.95:
                    # Half day
                    check_in_time = datetime.combine(record_date, datetime.min.time(), timezone.utc) + timedelta(hours=9)
                    check_out_time = check_in_time + timedelta(hours=3, minutes=30)
                    status = AttendanceStatus.HALF_DAY.value
                    hours = 3.5
                else:
                    # Absent
                    check_in_time = None
                    check_out_time = None
                    status = AttendanceStatus.ABSENT.value
                    hours = 0.0

                att = Attendance(
                    employee_id=emp.id,
                    date=record_date,
                    check_in=check_in_time,
                    check_out=check_out_time,
                    total_hours=round(hours, 2) if hours > 0 else None,
                    status=status,
                    check_in_ip="192.168.1." + str(random.randint(10, 200)),
                )
                db.add(att)
                attendance_count += 1

        await db.flush()
        logger.info("Created %d attendance records.", attendance_count)

        logger.info("Seeding Leave Requests...")
        leave_requests_data = [
            (all_employees[2], LeaveType.ANNUAL, today + timedelta(days=5), today + timedelta(days=9), 5, "Annual family vacation to Hawaii", LeaveStatus.APPROVED, admin_user.id),
            (all_employees[3], LeaveType.SICK, today - timedelta(days=3), today - timedelta(days=2), 2, "Flu symptoms and fever", LeaveStatus.APPROVED, hr_user.id),
            (all_employees[4], LeaveType.PERSONAL, today + timedelta(days=12), today + timedelta(days=13), 2, "Attending a family wedding", LeaveStatus.PENDING, None),
            (all_employees[5], LeaveType.ANNUAL, today + timedelta(days=20), today + timedelta(days=25), 5, "Summer road trip", LeaveStatus.PENDING, None),
            (all_employees[6], LeaveType.PERSONAL, today - timedelta(days=10), today - timedelta(days=10), 1, "Dental surgery", LeaveStatus.REJECTED, admin_user.id),
        ]
        for emp, l_type, s_date, e_date, days, reason, status, reviewer_id in leave_requests_data:
            lr = LeaveRequest(
                employee_id=emp.id,
                approved_by=reviewer_id,
                leave_type=l_type.value,
                start_date=s_date,
                end_date=e_date,
                total_days=days,
                reason=reason,
                status=status.value,
                admin_remarks="Approved — enjoy your break!" if status == LeaveStatus.APPROVED else ("Please reschedule due to release deadline." if status == LeaveStatus.REJECTED else None),
                reviewed_at=datetime.now(timezone.utc) if status != LeaveStatus.PENDING else None,
            )
            db.add(lr)
        await db.flush()
        logger.info("Created %d leave requests.", len(leave_requests_data))

        logger.info("Seeding Monthly Payroll Records (Previous Month)...")
        # Generate for previous month e.g. "2026-06"
        prev_month = today.replace(day=1) - timedelta(days=1)
        period_str = prev_month.strftime("%Y-%m")
        working_days = 22

        for emp in all_employees:
            base_monthly = float(emp.base_salary) / 12.0
            allowances = 500.00 if emp.job_title and "Senior" in emp.job_title else 250.00
            overtime = random.choice([0.0, 150.0, 300.0, 450.0])
            gross = base_monthly + allowances + overtime
            tax = gross * settings.TAX_RATE
            net = gross - tax

            pay = Payroll(
                employee_id=emp.id,
                payroll_period=period_str,
                base_salary=round(base_monthly, 2),
                allowances=round(allowances, 2),
                deductions=0.00,
                overtime_pay=round(overtime, 2),
                gross_salary=round(gross, 2),
                tax=round(tax, 2),
                net_salary=round(net, 2),
                working_days=working_days,
                days_present=working_days - random.choice([0, 0, 0, 1]),
                days_absent=0,
                status=PayrollStatus.PAID.value,
                payment_date=date(prev_month.year, prev_month.month, 28),
            )
            db.add(pay)
        await db.flush()
        logger.info("Created %d payroll records.", len(all_employees))

        logger.info("Seeding Notifications & Audit Logs...")
        notif = Notification(
            user_id=admin_user.id,
            title="Welcome to HR Nexus",
            message="Your enterprise HR management portal is fully initialized and ready for the hackathon demo.",
            type=NotificationType.SYSTEM.value,
            is_read=False,
            metadata_json={"version": settings.APP_VERSION},
        )
        db.add(notif)

        audit = AuditLog(
            user_id=admin_user.id,
            action="SYSTEM_SEED",
            entity_type="System",
            entity_id=admin_user.id,
            new_values={"status": "initialized", "employees_seeded": len(all_employees)},
            ip_address="127.0.0.1",
        )
        db.add(audit)

        await db.commit()
        logger.info("✅ Database seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
