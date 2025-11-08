// src/data/hrms.js

// ---- Entities (aligned to your ERD) ----
export const departments = [
  { department_id: 1, department_name: "Engineering", manager_id: 3 },
  { department_id: 2, department_name: "HR", manager_id: 5 },
  { department_id: 3, department_name: "Operations", manager_id: 7 },
];

export const roles = [
  { role_id: 1, role_name: "Employee" },
  { role_id: 2, role_name: "HR Officer" },
  { role_id: 3, role_name: "Admin" },
];

export const employees = [
  {
    employee_id: 1,
    first_name: "Aarav",
    last_name: "Mehta",
    email: "aarav.mehta@workzen.io",
    phone_number: "+91 98765 43210",
    address: "Ahmedabad, IN",
    date_of_birth: "1997-04-18",
    date_of_joining: "2025-10-01",
    department_id: 1,
    role_id: 1,
    status: "active",
    created_at: "2025-10-01T09:00:00Z",
    updated_at: "2025-11-07T11:00:00Z",
  },
  {
    employee_id: 2,
    first_name: "Jiya",
    last_name: "Sharma",
    email: "jiya.sharma@workzen.io",
    phone_number: "+91 99880 12345",
    address: "Mumbai, IN",
    date_of_birth: "1998-07-02",
    date_of_joining: "2025-10-15",
    department_id: 2,
    role_id: 2,
    status: "active",
    created_at: "2025-10-15T09:00:00Z",
    updated_at: "2025-11-06T09:30:00Z",
  },
  {
    employee_id: 3,
    first_name: "Kabir",
    last_name: "Patel",
    email: "kabir.patel@workzen.io",
    phone_number: "+91 90000 11111",
    address: "Bengaluru, IN",
    date_of_birth: "1993-01-09",
    date_of_joining: "2024-12-01",
    department_id: 1,
    role_id: 3,
    status: "active",
    created_at: "2024-12-01T09:00:00Z",
    updated_at: "2025-11-01T12:00:00Z",
  },
  {
    employee_id: 5,
    first_name: "Riya",
    last_name: "Kapoor",
    email: "riya.kapoor@workzen.io",
    phone_number: "+91 95555 22222",
    address: "Pune, IN",
    date_of_birth: "1995-03-30",
    date_of_joining: "2025-11-01",
    department_id: 2,
    role_id: 2,
    status: "active",
    created_at: "2025-11-01T09:00:00Z",
    updated_at: "2025-11-07T08:00:00Z",
  },
  {
    employee_id: 7,
    first_name: "Dev",
    last_name: "Singh",
    email: "dev.singh@workzen.io",
    phone_number: "+91 93333 77777",
    address: "Delhi, IN",
    date_of_birth: "1990-10-20",
    date_of_joining: "2023-07-01",
    department_id: 3,
    role_id: 1,
    status: "active",
    created_at: "2023-07-01T09:00:00Z",
    updated_at: "2025-10-28T10:00:00Z",
  },
];

export const onboarding_processes = [
  {
    onboarding_id: 101,
    employee_id: 1,
    assigned_hr_id: 5,
    onboarding_status: "in_progress",
    start_date: "2025-10-01",
    completion_date: null,
    remarks: "Laptop issued; verification pending",
  },
  {
    onboarding_id: 102,
    employee_id: 2,
    assigned_hr_id: 5,
    onboarding_status: "under_review",
    start_date: "2025-10-15",
    completion_date: null,
    remarks: "Waiting for Aadhaar verification",
  },
  {
    onboarding_id: 103,
    employee_id: 5,
    assigned_hr_id: 2,
    onboarding_status: "initiated",
    start_date: "2025-11-01",
    completion_date: null,
    remarks: "Kickoff meeting scheduled",
  },
];

export const onboarding_steps = [
  {
    step_id: 1001,
    onboarding_id: 101,
    step_name: "Document Verification",
    step_status: "pending",
    assigned_to: 5,
    completed_at: null,
  },
  {
    step_id: 1002,
    onboarding_id: 101,
    step_name: "Account Setup",
    step_status: "completed",
    assigned_to: 5,
    completed_at: "2025-10-02T10:10:00Z",
  },
  {
    step_id: 1003,
    onboarding_id: 101,
    step_name: "Orientation",
    step_status: "pending",
    assigned_to: 5,
    completed_at: null,
  },

  {
    step_id: 1011,
    onboarding_id: 102,
    step_name: "Document Verification",
    step_status: "completed",
    assigned_to: 5,
    completed_at: "2025-10-16T11:00:00Z",
  },
  {
    step_id: 1012,
    onboarding_id: 102,
    step_name: "Account Setup",
    step_status: "completed",
    assigned_to: 5,
    completed_at: "2025-10-17T14:30:00Z",
  },
  {
    step_id: 1013,
    onboarding_id: 102,
    step_name: "Orientation",
    step_status: "pending",
    assigned_to: 2,
    completed_at: null,
  },

  {
    step_id: 1021,
    onboarding_id: 103,
    step_name: "Document Verification",
    step_status: "pending",
    assigned_to: 2,
    completed_at: null,
  },
];

export const documents = [
  {
    document_id: 1,
    employee_id: 1,
    document_type: "Aadhaar",
    file_url: "#",
    verified_by: null,
    verification_status: "pending",
    uploaded_at: "2025-10-01T09:30:00Z",
  },
  {
    document_id: 2,
    employee_id: 1,
    document_type: "PAN",
    file_url: "#",
    verified_by: null,
    verification_status: "pending",
    uploaded_at: "2025-10-01T09:35:00Z",
  },
  {
    document_id: 3,
    employee_id: 2,
    document_type: "Aadhaar",
    file_url: "#",
    verified_by: 5,
    verification_status: "verified",
    uploaded_at: "2025-10-15T10:00:00Z",
  },
];

export const notifications = [
  {
    notification_id: 1,
    employee_id: 5,
    message: "Aadhaar verification pending for Aarav",
    type: "system",
    status: "unread",
    created_at: "2025-11-07T10:00:00Z",
  },
  {
    notification_id: 2,
    employee_id: 5,
    message: "Orientation not scheduled for Aarav",
    type: "system",
    status: "unread",
    created_at: "2025-11-07T11:00:00Z",
  },
  {
    notification_id: 3,
    employee_id: 2,
    message: "Onboarding review due (Jiya)",
    type: "email",
    status: "sent",
    created_at: "2025-11-06T08:00:00Z",
  },
];

// ---- Helpers for counts/KPIs ----
export const kpis = {
  totalEmployees: employees.length,
  pendingVerifications: documents.filter(
    (d) => d.verification_status === "pending"
  ).length,
  onboardingInProgress: onboarding_processes.filter((p) =>
    ["initiated", "in_progress", "under_review"].includes(p.onboarding_status)
  ).length,
  approvalsQueued: onboarding_steps.filter((s) => s.step_status === "pending")
    .length,
};