const db = require('../config/db');

/**
 * Get attendance records with filters
 */
const getAttendanceRecords = async (req, res) => {
  try {
    const { date, startDate, endDate, department, status, employeeId } = req.query;

    let query = db('attendance_records')
      .select(
        'attendance_records.*',
        'users.name as employee_name',
        'users.employee_id as employee_code',
        'users.email',
        'departments.name as department_name'
      )
      .leftJoin('users', 'attendance_records.employee_id', 'users.id')
      .leftJoin('departments', 'users.department_id', 'departments.id');

    // Apply filters
    if (date) {
      query = query.where('attendance_records.date', date);
    }

    if (startDate && endDate) {
      query = query.whereBetween('attendance_records.date', [startDate, endDate]);
    }

    if (department && department !== 'all') {
      query = query.where('departments.name', department);
    }

    if (status && status !== 'all') {
      query = query.where('attendance_records.status', status);
    }

    if (employeeId) {
      query = query.where('attendance_records.employee_id', employeeId);
    }

    const records = await query.orderBy('attendance_records.date', 'desc');

    // Calculate statistics
    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      halfDay: records.filter(r => r.status === 'Half Day').length,
      late: records.filter(r => {
        if (!r.check_in_time) return false;
        const checkIn = new Date(`2000-01-01 ${r.check_in_time}`);
        const standardTime = new Date(`2000-01-01 09:30:00`);
        return checkIn > standardTime;
      }).length,
    };

    res.status(200).json({
      success: true,
      data: {
        records,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
};

/**
 * Get attendance summary for dashboard
 */
const getAttendanceSummary = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    // Get today's attendance
    const todayRecords = await db('attendance_records')
      .select(
        'attendance_records.*',
        'users.name as employee_name',
        'users.employee_id as employee_code'
      )
      .leftJoin('users', 'attendance_records.employee_id', 'users.id')
      .where('attendance_records.date', date);

    // Get total active employees
    const totalEmployees = await db('users')
      .where('status', 'active')
      .whereNotIn('role', ['admin'])
      .count('* as count')
      .first();

    const stats = {
      date,
      totalEmployees: parseInt(totalEmployees.count),
      present: todayRecords.filter(r => r.status === 'Present').length,
      absent: totalEmployees.count - todayRecords.length,
      halfDay: todayRecords.filter(r => r.status === 'Half Day').length,
      late: todayRecords.filter(r => {
        if (!r.check_in_time) return false;
        const checkIn = new Date(`2000-01-01 ${r.check_in_time}`);
        const standardTime = new Date(`2000-01-01 09:30:00`);
        return checkIn > standardTime;
      }).length,
      attendanceRate: totalEmployees.count > 0 
        ? ((todayRecords.length / totalEmployees.count) * 100).toFixed(1)
        : 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance summary',
      error: error.message
    });
  }
};

/**
 * Check in attendance
 */
const checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    // Check if already checked in today
    const existing = await db('attendance_records')
      .where({
        employee_id: employeeId,
        date: today
      })
      .first();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    // Create attendance record
    const [record] = await db('attendance_records')
      .insert({
        employee_id: employeeId,
        date: today,
        check_in_time: currentTime,
        status: 'Present',
        notes: notes || null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: record
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in',
      error: error.message
    });
  }
};

/**
 * Check out attendance
 */
const checkOut = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    // Find today's record
    const record = await db('attendance_records')
      .where({
        employee_id: employeeId,
        date: today
      })
      .first();

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }

    if (record.check_out_time) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    // Calculate hours worked
    const checkIn = new Date(`2000-01-01 ${record.check_in_time}`);
    const checkOut = new Date(`2000-01-01 ${currentTime}`);
    const hoursWorked = ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2);

    // Update record
    await db('attendance_records')
      .where({ id: record.id })
      .update({
        check_out_time: currentTime,
        hours_worked: hoursWorked,
        updated_at: new Date()
      });

    const updated = await db('attendance_records')
      .where({ id: record.id })
      .first();

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out',
      error: error.message
    });
  }
};

/**
 * Get employee's own attendance records
 */
const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;

    let query = db('attendance_records')
      .where('employee_id', employeeId)
      .orderBy('date', 'desc')
      .limit(parseInt(limit));

    if (startDate && endDate) {
      query = query.whereBetween('date', [startDate, endDate]);
    }

    const records = await query;

    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error fetching my attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
};

/**
 * Mark attendance for employee (Admin/HR only)
 */
const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkInTime, checkOutTime, notes } = req.body;

    // Check if record exists
    const existing = await db('attendance_records')
      .where({ employee_id: employeeId, date })
      .first();

    let hoursWorked = null;
    if (checkInTime && checkOutTime) {
      const checkIn = new Date(`2000-01-01 ${checkInTime}`);
      const checkOut = new Date(`2000-01-01 ${checkOutTime}`);
      hoursWorked = ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2);
    }

    const recordData = {
      employee_id: employeeId,
      date,
      status,
      check_in_time: checkInTime || null,
      check_out_time: checkOutTime || null,
      hours_worked: hoursWorked,
      notes: notes || null,
      updated_at: new Date()
    };

    if (existing) {
      // Update existing record
      await db('attendance_records')
        .where({ id: existing.id })
        .update(recordData);

      const updated = await db('attendance_records')
        .where({ id: existing.id })
        .first();

      res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        data: updated
      });
    } else {
      // Create new record
      recordData.created_at = new Date();
      const [record] = await db('attendance_records')
        .insert(recordData)
        .returning('*');

      res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
        data: record
      });
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

/**
 * Get departments list
 */
const getDepartments = async (req, res) => {
  try {
    const departments = await db('departments')
      .select('id', 'name')
      .orderBy('name', 'asc');

    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
};

module.exports = {
  getAttendanceRecords,
  getAttendanceSummary,
  checkIn,
  checkOut,
  getMyAttendance,
  markAttendance,
  getDepartments
};
