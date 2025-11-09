-- WorkZen HRMS - Database Schema
-- PostgreSQL 12+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Authentication)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('admin', 'hr_officer', 'payroll_officer', 'manager', 'employee')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  dob DATE,
  gender VARCHAR(10),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  department VARCHAR(100),
  position VARCHAR(100),
  manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  date_of_joining DATE NOT NULL,
  employment_status VARCHAR(50) DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave', 'terminated')),
  pan VARCHAR(255),
  aadhaar VARCHAR(255),
  basic_salary DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Onboarding Requests Table
CREATE TABLE IF NOT EXISTS onboarding_requests (
  id SERIAL PRIMARY KEY,
  token UUID UNIQUE NOT NULL,
  candidate_email VARCHAR(255) UNIQUE NOT NULL,
  candidate_name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  joining_date DATE NOT NULL,
  
  -- Step 1: Personal Information
  full_name VARCHAR(100),
  dob DATE,
  contact_number VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  
  -- Step 2: Bank Information
  bank_name VARCHAR(100),
  account_number VARCHAR(255),
  ifsc_code VARCHAR(11),
  account_holder_name VARCHAR(100),
  
  -- Step 3 & 4: Government IDs
  pan VARCHAR(255),
  aadhaar VARCHAR(255),
  pan_verified BOOLEAN DEFAULT false,
  aadhaar_verified BOOLEAN DEFAULT false,
  
  -- Status Tracking
  status VARCHAR(50) DEFAULT 'invited' CHECK (status IN (
    'invited', 'step1_completed', 'step2_completed', 'step3_completed', 
    'pending_review', 'revision_required', 'approved', 'rejected'
  )),
  
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMP,
  rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  rejection_reason TEXT,
  revision_reason TEXT,
  approval_notes TEXT,
  
  linked_employee_id INTEGER UNIQUE REFERENCES employees(id) ON DELETE SET NULL,
  
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_token (token),
  INDEX idx_email (candidate_email),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);

-- Onboarding Documents Table
CREATE TABLE IF NOT EXISTS onboarding_documents (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL,
  doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('pan', 'aadhaar', 'resume', 'address_proof')),
  filename VARCHAR(255) NOT NULL,
  filepath TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  ocr_text TEXT,
  ocr_confidence DECIMAL(3, 2),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (onboarding_id) REFERENCES onboarding_requests(id) ON DELETE CASCADE,
  INDEX idx_onboarding (onboarding_id),
  INDEX idx_doc_type (doc_type)
);

-- Onboarding Reviews Table
CREATE TABLE IF NOT EXISTS onboarding_reviews (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL,
  reviewed_by INTEGER NOT NULL,
  review_action VARCHAR(50) NOT NULL CHECK (review_action IN ('approved', 'rejected', 'revision_requested')),
  notes TEXT,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (onboarding_id) REFERENCES onboarding_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('present', 'absent', 'half_day', 'on_leave', 'sick_leave')),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  duration_hours DECIMAL(5, 2),
  notes TEXT,
  marked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE (employee_id, attendance_date),
  INDEX idx_employee (employee_id),
  INDEX idx_date (attendance_date),
  INDEX idx_status (status)
);

-- Leave Types Table
CREATE TABLE IF NOT EXISTS leave_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  default_days INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaves Table
CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  leave_type_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_days DECIMAL(5, 2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  applied_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_on TIMESTAMP,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejected_on TIMESTAMP,
  rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
  INDEX idx_employee (employee_id),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date)
);

-- Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  basic_salary DECIMAL(12, 2) NOT NULL,
  allowances DECIMAL(12, 2) DEFAULT 0,
  deductions DECIMAL(12, 2) DEFAULT 0,
  pf_contribution DECIMAL(12, 2) DEFAULT 0,
  tax_deduction DECIMAL(12, 2) DEFAULT 0,
  gross_salary DECIMAL(12, 2) GENERATED ALWAYS AS (basic_salary + allowances) STORED,
  net_salary DECIMAL(12, 2) GENERATED ALWAYS AS (basic_salary + allowances - deductions - pf_contribution - tax_deduction) STORED,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'failed')),
  processed_on TIMESTAMP,
  processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE (employee_id, month, year),
  INDEX idx_employee (employee_id),
  INDEX idx_period (year, month)
);

-- Payslips Table
CREATE TABLE IF NOT EXISTS payslips (
  id SERIAL PRIMARY KEY,
  payroll_id INTEGER NOT NULL UNIQUE,
  employee_id INTEGER NOT NULL,
  payslip_number VARCHAR(50) UNIQUE NOT NULL,
  payment_date DATE,
  basic_salary DECIMAL(12, 2),
  allowances DECIMAL(12, 2),
  deductions DECIMAL(12, 2),
  pf_contribution DECIMAL(12, 2),
  tax_deduction DECIMAL(12, 2),
  gross_salary DECIMAL(12, 2),
  net_salary DECIMAL(12, 2),
  pdf_url TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_to_email_at TIMESTAMP,
  
  FOREIGN KEY (payroll_id) REFERENCES payroll(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee (employee_id),
  INDEX idx_generated (generated_at)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER,
  user_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_created (created_at),
  INDEX idx_action (action)
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_requests(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_token ON onboarding_requests(token);

-- Create Views
CREATE OR REPLACE VIEW v_active_employees AS
SELECT id, employee_id, first_name, last_name, email, department, position, date_of_joining
FROM employees
WHERE employment_status = 'active';

CREATE OR REPLACE VIEW v_pending_leaves AS
SELECT 
  l.id, l.employee_id, e.first_name, e.last_name, e.email,
  lt.name as leave_type, l.start_date, l.end_date, l.reason, l.applied_on
FROM leaves l
JOIN employees e ON l.employee_id = e.id
JOIN leave_types lt ON l.leave_type_id = lt.id
WHERE l.status = 'pending'
ORDER BY l.applied_on DESC;

CREATE OR REPLACE VIEW v_payroll_summary AS
SELECT 
  EXTRACT(YEAR FROM DATE_TRUNC('month', created_at))::INTEGER as year,
  EXTRACT(MONTH FROM DATE_TRUNC('month', created_at))::INTEGER as month,
  COUNT(*) as total_employees,
  SUM(gross_salary) as total_gross,
  SUM(net_salary) as total_net,
  AVG(net_salary) as avg_net
FROM payroll
GROUP BY year, month
ORDER BY year DESC, month DESC;

-- Insert Default Leave Types
INSERT INTO leave_types (name, code, default_days, is_paid, requires_approval)
VALUES
  ('Casual Leave', 'CL', 12, true, true),
  ('Sick Leave', 'SL', 7, true, false),
  ('Paid Leave', 'PL', 0, true, true),
  ('Unpaid Leave', 'UL', 0, false, true),
  ('Maternity Leave', 'ML', 180, true, true),
  ('Paternity Leave', 'PL', 15, true, true)
ON CONFLICT DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER employees_timestamp BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER onboarding_timestamp BEFORE UPDATE ON onboarding_requests FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER attendance_timestamp BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER payroll_timestamp BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_timestamp();
