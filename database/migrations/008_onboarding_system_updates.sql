-- ============================================================================
-- WorkZen HRMS - Database Schema Updates for Onboarding System
-- ============================================================================
-- Description: This file contains all schema updates required for the 
--              complete onboarding system functionality
-- Date: November 9, 2025
-- Version: 1.0
-- ============================================================================

-- ============================================================================
-- SECTION 1: Onboarding Requests Table - Add Missing Columns
-- ============================================================================

-- Add PAN and Aadhaar columns for identity documents
ALTER TABLE onboarding_requests 
ADD COLUMN IF NOT EXISTS pan VARCHAR(255);

ALTER TABLE onboarding_requests 
ADD COLUMN IF NOT EXISTS aadhaar VARCHAR(255);

-- Add verification status columns
ALTER TABLE onboarding_requests 
ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT false;

ALTER TABLE onboarding_requests 
ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT false;

-- Add HR review and change request columns
ALTER TABLE onboarding_requests 
ADD COLUMN IF NOT EXISTS review_comments TEXT;

ALTER TABLE onboarding_requests 
ADD COLUMN IF NOT EXISTS fields_to_change JSONB;

ALTER TABLE onboarding_requests 
ADD COLUMN IF NOT EXISTS revised_by INTEGER REFERENCES users(id);

ALTER TABLE onboarding_requests 
ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMP;

-- ============================================================================
-- SECTION 2: Employee ID Sequences Table
-- ============================================================================

-- Create table for auto-generating employee IDs
CREATE TABLE IF NOT EXISTS employee_id_sequences (
  id SERIAL PRIMARY KEY,
  company_code VARCHAR(2) NOT NULL,
  year INTEGER NOT NULL,
  last_serial INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_code, year)
);

-- Insert default company code sequence
INSERT INTO employee_id_sequences (company_code, year, last_serial) 
VALUES ('OI', EXTRACT(YEAR FROM CURRENT_DATE), 0)
ON CONFLICT (company_code, year) DO NOTHING;

-- ============================================================================
-- SECTION 3: Indexes for Performance Optimization
-- ============================================================================

-- Add indexes for faster queries on onboarding_requests
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_requests(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_token ON onboarding_requests(token);
CREATE INDEX IF NOT EXISTS idx_onboarding_email ON onboarding_requests(candidate_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_pan ON onboarding_requests(pan);
CREATE INDEX IF NOT EXISTS idx_onboarding_aadhaar ON onboarding_requests(aadhaar);
CREATE INDEX IF NOT EXISTS idx_onboarding_submitted_at ON onboarding_requests(submitted_at);

-- Add indexes for employee_id_sequences
CREATE INDEX IF NOT EXISTS idx_employee_seq_company_year ON employee_id_sequences(company_code, year);

-- ============================================================================
-- SECTION 4: Update Existing Table Constraints
-- ============================================================================

-- Add check constraint for onboarding status
ALTER TABLE onboarding_requests 
DROP CONSTRAINT IF EXISTS onboarding_requests_status_check;

ALTER TABLE onboarding_requests 
ADD CONSTRAINT onboarding_requests_status_check 
CHECK (status IN (
  'invited', 
  'step1_completed', 
  'step2_completed', 
  'step3_completed', 
  'pending_review', 
  'approved', 
  'changes_requested',
  'revision_required', 
  'rejected'
));

-- ============================================================================
-- SECTION 5: Comments for Documentation
-- ============================================================================

COMMENT ON TABLE onboarding_requests IS 'Stores candidate onboarding requests and submissions';
COMMENT ON COLUMN onboarding_requests.token IS 'Unique token for candidate onboarding link';
COMMENT ON COLUMN onboarding_requests.personal_info IS 'JSONB field storing personal information from Step 1';
COMMENT ON COLUMN onboarding_requests.bank_info IS 'JSONB field storing bank details from Step 2';
COMMENT ON COLUMN onboarding_requests.pan IS 'PAN number for identity verification';
COMMENT ON COLUMN onboarding_requests.aadhaar IS 'Aadhaar number for identity verification';
COMMENT ON COLUMN onboarding_requests.review_comments IS 'HR comments when requesting changes';
COMMENT ON COLUMN onboarding_requests.fields_to_change IS 'Array of fields that need correction';

COMMENT ON TABLE employee_id_sequences IS 'Manages auto-increment sequences for employee ID generation';
COMMENT ON COLUMN employee_id_sequences.company_code IS 'Two-letter company code (e.g., OI, WZ)';
COMMENT ON COLUMN employee_id_sequences.year IS 'Year for which the sequence is tracked';
COMMENT ON COLUMN employee_id_sequences.last_serial IS 'Last used serial number for the year';

-- ============================================================================
-- SECTION 6: Verification Queries
-- ============================================================================

-- Verify all columns exist
DO $$ 
DECLARE
  missing_columns TEXT;
BEGIN
  SELECT string_agg(column_name, ', ')
  INTO missing_columns
  FROM (
    VALUES 
      ('pan'), 
      ('aadhaar'), 
      ('pan_verified'), 
      ('aadhaar_verified'),
      ('review_comments'),
      ('fields_to_change'),
      ('revised_by'),
      ('revision_requested_at')
  ) AS expected(column_name)
  WHERE NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'onboarding_requests' 
    AND column_name = expected.column_name
  );

  IF missing_columns IS NOT NULL THEN
    RAISE NOTICE 'Warning: Missing columns in onboarding_requests: %', missing_columns;
  ELSE
    RAISE NOTICE 'Success: All required columns exist in onboarding_requests table';
  END IF;
END $$;

-- Verify employee_id_sequences table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'employee_id_sequences'
  ) THEN
    RAISE EXCEPTION 'Error: employee_id_sequences table does not exist';
  ELSE
    RAISE NOTICE 'Success: employee_id_sequences table exists';
  END IF;
END $$;

-- ============================================================================
-- SECTION 7: Sample Data for Testing (Optional - Comment out for production)
-- ============================================================================

-- Uncomment below lines to insert sample data for testing

/*
-- Sample onboarding request
INSERT INTO onboarding_requests (
  token, 
  candidate_email, 
  candidate_name, 
  department, 
  position, 
  joining_date,
  status,
  created_by
) VALUES (
  'sample-token-' || gen_random_uuid(),
  'test.candidate@example.com',
  'Test Candidate',
  'Engineering',
  'Software Developer',
  CURRENT_DATE + INTERVAL '30 days',
  'invited',
  1
);
*/

-- ============================================================================
-- EXECUTION SUMMARY
-- ============================================================================

SELECT 
  'Database schema update completed successfully!' AS message,
  NOW() AS execution_time;

-- Show current onboarding_requests table structure
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'onboarding_requests'
ORDER BY ordinal_position;

-- Show employee_id_sequences table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'employee_id_sequences'
ORDER BY ordinal_position;

-- ============================================================================
-- END OF SCHEMA UPDATE
-- ============================================================================
