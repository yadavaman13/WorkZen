-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create employee_id_sequences table for auto-incrementing employee IDs
CREATE TABLE IF NOT EXISTS employee_id_sequences (
  id SERIAL PRIMARY KEY,
  company_code VARCHAR(2) NOT NULL,
  year INTEGER NOT NULL,
  last_serial INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_code, year)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'System administrator with full access'),
('hr_officer', 'HR staff for recruiting and employee management'),
('manager', 'Department manager with team oversight'),
('employee', 'Regular employee with limited access'),
('contractor', 'Temporary contractor with minimal access')
ON CONFLICT DO NOTHING;
