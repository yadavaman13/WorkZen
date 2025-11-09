<div align="center">
  
  <!-- Logo Placeholder -->
  <img src="https://via.placeholder.com/200x200/A24689/FFFFFF?text=WorkZen" alt="WorkZen Logo" width="200"/>
  
  # WorkZen HRMS
  
  ### Modern Human Resource Management System
  
  *Streamline your workforce management with intelligent automation*
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
  
  [Features](#features) • [Tech Stack](#tech-stack) • [Installation](#installation) • [Usage](#usage) • [API Documentation](#api-documentation) • [Contributing](#contributing)
  
</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 🎯 About

**WorkZen HRMS** is a comprehensive Human Resource Management System designed to simplify and automate HR operations for modern organizations. Built with cutting-edge technologies, it provides an intuitive interface for managing employees, attendance, payroll, leave requests, and more.

### Why WorkZen?

- 🚀 **Modern & Fast**: Built with React 19 and Vite for lightning-fast performance
- 🔐 **Secure**: JWT-based authentication with role-based access control
- 📊 **Comprehensive**: Complete HR suite from onboarding to payroll
- 🎨 **Beautiful UI**: Clean, professional interface with Tailwind CSS
- 📱 **Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- 🔄 **Real-time**: Live attendance tracking with geolocation support

---

## ✨ Features

### 👥 Employee Management
- ✅ Employee onboarding and offboarding
- ✅ Profile management with document verification
- ✅ Department and role assignment
- ✅ Employee directory with advanced search
- ✅ Organizational hierarchy visualization

### ⏰ Attendance System
- ✅ **Multi-shift Support**: Fixed shifts, rotating rosters, flexible schedules
- ✅ **Punch Tracking**: Biometric, mobile app, and web-based check-in/out
- ✅ **Geofencing**: Location-based attendance validation
- ✅ **Anomaly Detection**: Missing punches, late arrivals, early departures
- ✅ **Overtime Calculation**: Automatic OT tracking with policy enforcement
- ✅ **Night Shifts**: Cross-midnight shift handling
- ✅ **Break Management**: Paid, unpaid, and auto-deduct breaks
- ✅ **Regularization**: Request and approve attendance corrections
- ✅ **Real-time Dashboard**: Live attendance stats and insights

### 🏖️ Leave Management
- ✅ Multiple leave types (Casual, Sick, Privilege, WFH)
- ✅ Leave balance tracking
- ✅ Approval workflow
- ✅ Leave calendar and planning
- ✅ Half-day and partial leave support

### 💰 Payroll Management
- ✅ Salary structure configuration
- ✅ Automated payroll processing
- ✅ Deduction and allowance management
- ✅ Payslip generation
- ✅ Tax calculation support

### 📊 Reports & Analytics
- ✅ Attendance reports and heatmaps
- ✅ Leave analytics
- ✅ Payroll summaries
- ✅ Employee performance metrics
- ✅ Custom report builder

### 🔐 Access Control
- ✅ **Role-based Access**: Employee, HR, Payroll, Admin roles
- ✅ **Permission Management**: Granular access control
- ✅ **Audit Logs**: Complete activity tracking
- ✅ **Secure Authentication**: JWT tokens with refresh mechanism

---

## 🛠️ Tech Stack

### Frontend
- **React 19.1.0** - UI library with latest features
- **Vite 7.2.2** - Fast build tool and dev server
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **React Router 7.9.5** - Client-side routing
- **Axios** - HTTP client for API calls

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL 15** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing

### DevOps & Tools
- **Git** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐           │
│  │   React    │  │  Tailwind  │  │   Vite      │           │
│  │   Router   │  │    CSS     │  │   Build     │           │
│  └────────────┘  └────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐           │
│  │    Auth    │  │  Employee  │  │ Attendance  │           │
│  │   Routes   │  │   Routes   │  │   Routes    │           │
│  └────────────┘  └────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐           │
│  │    Auth    │  │  Employee  │  │ Attendance  │           │
│  │ Controller │  │ Controller │  │ Controller  │           │
│  └────────────┘  └────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐           │
│  │   Users    │  │ Employees  │  │ Attendance  │           │
│  │   Model    │  │   Model    │  │   Model     │           │
│  └────────────┘  └────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v15 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yadavaman13/WorkZen.git
cd WorkZen
```

### Step 2: Setup Database

1. Create a PostgreSQL database:
```sql
CREATE DATABASE workzen_db;
```

2. Run the database migrations (if available):
```bash
cd server
npm run migrate
```

### Step 3: Install Dependencies

#### Backend Setup
```bash
cd server
npm install
```

#### Frontend Setup
```bash
cd ../client
npm install
```

### Step 4: Environment Configuration

#### Backend (.env)
Create a `.env` file in the `server` directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=workzen_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Client URL
CLIENT_URL=http://localhost:5173
```

#### Frontend (.env)
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Usage

### Development Mode

#### Start Backend Server
```bash
cd server
npm run dev
```
Server will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd client
npm run dev
```
Frontend will run on `http://localhost:5173`

### Production Build

#### Build Frontend
```bash
cd client
npm run build
```

#### Start Production Server
```bash
cd server
npm start
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "companyName": "Acme Corp",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "securepassword"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

### Employee Endpoints

#### Get All Employees
```http
GET /api/employees
Authorization: Bearer {token}
```

#### Get Employee by ID
```http
GET /api/employees/:id
Authorization: Bearer {token}
```

#### Create Employee
```http
POST /api/employees
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "9876543210",
  "department": "Engineering",
  "role": "employee",
  "dateOfJoining": "2025-01-01"
}
```

### Attendance Endpoints

#### Get Attendance Records
```http
GET /api/attendance?date=2025-11-09&employeeId=1
Authorization: Bearer {token}
```

#### Mark Attendance
```http
POST /api/attendance
Authorization: Bearer {token}
Content-Type: application/json

{
  "employeeId": 1,
  "attendanceDate": "2025-11-09",
  "status": "present",
  "checkInTime": "2025-11-09T09:00:00Z",
  "checkOutTime": "2025-11-09T18:00:00Z"
}
```

#### Request Regularization
```http
POST /api/attendance/regularization
Authorization: Bearer {token}
Content-Type: application/json

{
  "employeeId": 1,
  "workDate": "2025-11-09",
  "requestType": "ADD_PUNCH",
  "reason": "Forgot to punch out",
  "payload": {
    "punchType": "OUT",
    "time": "18:00:00"
  }
}
```

---

## 🗄️ Database Schema

### Key Tables

#### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Employees
```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  department_id INTEGER,
  date_of_joining DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Attendance
```sql
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  duration_hours DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE (employee_id, attendance_date)
);
```

#### Shifts
```sql
CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

[View Complete Schema →](./server/src/config/schema.sql)

---

## 📸 Screenshots

### Dashboard
<img src="https://via.placeholder.com/800x450/A24689/FFFFFF?text=Dashboard+Preview" alt="Dashboard" width="800"/>

*Main dashboard with real-time metrics and quick actions*

---

### Attendance Management
<img src="https://via.placeholder.com/800x450/A24689/FFFFFF?text=Attendance+Management" alt="Attendance" width="800"/>

*Comprehensive attendance tracking with shift details, anomalies, and approvals*

---

### Employee Directory
<img src="https://via.placeholder.com/800x450/A24689/FFFFFF?text=Employee+Directory" alt="Employees" width="800"/>

*Employee management with advanced search and filtering*

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
   ```bash
   git clone https://github.com/yadavaman13/WorkZen.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```

4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**

### Coding Standards
- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features
- Write tests for new functionality

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 WorkZen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👨‍💻 Authors

- **Aman Yadav** - *Lead Developer* - [@yadavaman13](https://github.com/yadavaman13)

---

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS approach
- PostgreSQL community for the robust database
- All contributors who helped shape this project

---

## 📞 Contact & Support

- **GitHub Issues**: [Report a bug](https://github.com/yadavaman13/WorkZen/issues)
- **Email**: support@workzen.io
- **Documentation**: [docs.workzen.io](https://docs.workzen.io)
- **Website**: [workzen.io](https://workzen.io)

---

## 🗺️ Roadmap

### Version 2.0 (Upcoming)
- [ ] Mobile application (React Native)
- [ ] Advanced analytics with charts
- [ ] AI-powered insights
- [ ] Integration with third-party payroll services
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Video interview scheduling
- [ ] Performance review system
- [ ] Training and development module
- [ ] Asset management

### Version 1.5
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Document management
- [ ] Expense tracking
- [ ] Time tracking for projects

---

<div align="center">
  
  ### ⭐ Star this repository if you find it helpful!
  
  Made with ❤️ by the WorkZen Team
  
  © 2025 WorkZen. All rights reserved.
  
</div>
