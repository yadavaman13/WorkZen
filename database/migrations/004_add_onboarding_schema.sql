-- Onboarding Requests Table
CREATE TABLE onboarding_requests (
  id SERIAL PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  candidate_email VARCHAR(255) NOT NULL,
  candidate_name VARCHAR(200) NOT NULL,
  department VARCHAR(100),
  position VARCHAR(100),
  joining_date DATE,

  -- Step 1 - Personal Info
  full_name VARCHAR(200),
  dob DATE,
  contact_number VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),

  -- Step 2 - Bank Info
  bank_name VARCHAR(100),
  account_number VARCHAR(255),
  ifsc_code VARCHAR(20),
  account_holder_name VARCHAR(200),

  -- Step 3 - Documents
  pan VARCHAR(255),
  aadhaar VARCHAR(255),
  pan_verified BOOLEAN DEFAULT false,
  aadhaar_verified BOOLEAN DEFAULT false,

  -- Status
  status VARCHAR(50) CHECK (status IN ('invited', 'step1_completed', 'step2_completed', 'step3_completed', 'pending_review', 'approved', 'revision_required', 'rejected')) DEFAULT 'invited',

  -- Approval/Rejection
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  approval_notes TEXT,

  rejected_by INTEGER REFERENCES users(id),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,

  revised_by INTEGER REFERENCES users(id),
  revision_reason TEXT,
  revision_requested_at TIMESTAMP,

  submitted_at TIMESTAMP,
  linked_employee_id INTEGER REFERENCES employees(id),

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Documents Table
CREATE TABLE onboarding_documents (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES onboarding_requests(id) ON DELETE CASCADE,
  doc_type VARCHAR(50),
  filename VARCHAR(255),
  filepath TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Reviews Table
CREATE TABLE onboarding_reviews (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES onboarding_requests(id) ON DELETE CASCADE,
  reviewed_by INTEGER REFERENCES users(id),
  action VARCHAR(50) CHECK (action IN ('approved', 'rejected', 'changes_requested')),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_onboarding_token ON onboarding_requests(token);
CREATE INDEX idx_onboarding_email ON onboarding_requests(candidate_email);
CREATE INDEX idx_onboarding_status ON onboarding_requests(status);
CREATE INDEX idx_onboarding_docs ON onboarding_documents(onboarding_id);
