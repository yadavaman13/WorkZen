const db = require("../config/db");

// Helper to calculate hours
function calculateHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`2000-01-01 ${checkIn}`);
  const end = new Date(`2000-01-01 ${checkOut}`);
  const hours = (end - start) / (1000 * 60 * 60);
  return Math.max(0, parseFloat(hours.toFixed(2)));
}

async function checkIn(req, res) {
  try {
    const employeeId = req.user.id;
    const today = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toTimeString().split(" ")[0];
    
    const existing = await db("attendance_records")
      .where({ employee_id: employeeId, attendance_date: today })
      .first();
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already checked in today"
      });
    }
    
    const [record] = await db("attendance_records")
      .insert({
        employee_id: employeeId,
        attendance_date: today,
        check_in_time: currentTime,
        status: "Present"
      })
      .returning("*");
    
    return res.json({
      success: true,
      message: "Checked in successfully",
      data: record
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function checkOut(req, res) {
  try {
    const employeeId = req.user.id;
    const today = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toTimeString().split(" ")[0];
    
    const record = await db("attendance_records")
      .where({ employee_id: employeeId, attendance_date: today })
      .first();
    
    if (!record) {
      return res.status(400).json({
        success: false,
        message: "No check-in record found for today"
      });
    }
    
    if (record.check_out_time) {
      return res.status(400).json({
        success: false,
        message: "You have already checked out today"
      });
    }
    
    const hoursWorked = calculateHours(record.check_in_time, currentTime);
    
    const [updated] = await db("attendance_records")
      .where({ id: record.id })
      .update({
        check_out_time: currentTime,
        hours_worked: hoursWorked,
        updated_at: db.fn.now()
      })
      .returning("*");
    
    return res.json({
      success: true,
      message: `Checked out successfully. You worked ${hoursWorked} hours today.`,
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getMyAttendance(req, res) {
  try {
    const employeeId = req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;
    
    let query = db("attendance_records")
      .where({ employee_id: employeeId })
      .orderBy("attendance_date", "desc");
    
    if (startDate) query = query.where("attendance_date", ">=", startDate);
    if (endDate) query = query.where("attendance_date", "<=", endDate);
    
    const records = await query.limit(parseInt(limit));
    
    return res.json({ success: true, data: records });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getAttendanceRecords(req, res) {
  try {
    const { date, department, status } = req.query;
    const targetDate = date || new Date().toISOString().split("T")[0];
    
    let query = db("attendance_records as ar")
      .leftJoin("users as u", "ar.employee_id", "u.id")
      .select(
        "ar.*",
        "u.name as employee_name",
        "u.email",
        "u.employee_id as employee_code",
        "u.department as department_name",
        "u.job_title"
      )
      .where("ar.attendance_date", targetDate);
    
    if (department && department !== "all") {
      query = query.where("u.department", department);
    }
    
    if (status && status !== "all") {
      query = query.where("ar.status", status);
    }
    
    const records = await query.orderBy("ar.check_in_time", "asc");
    
    const stats = {
      total: records.length,
      uniqueEmployees: new Set(records.map(r => r.employee_id)).size,
      present: records.filter(r => r.status === "Present").length,
      absent: records.filter(r => r.status === "Absent").length,
      halfDay: records.filter(r => r.status === "HalfDay").length,
      late: records.filter(r => r.is_late).length,
      onTime: records.filter(r => !r.is_late && r.check_in_time).length,
      attendanceRate: 0
    };
    
    const totalEmp = await db("users")
      .where({ role: "employee", status: "active" })
      .count("* as count")
      .first();
    
    const total = parseInt(totalEmp?.count || 0);
    if (total > 0) {
      stats.attendanceRate = Math.round((stats.present / total) * 100);
    }
    
    return res.json({ success: true, data: { records, stats } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getDepartments(req, res) {
  try {
    const deps = await db("users")
      .distinct("department")
      .whereNotNull("department")
      .orderBy("department");
    
    const formatted = deps
      .filter(d => d.department)
      .map((d, index) => ({
        id: index + 1,
        name: d.department
      }));
    
    return res.json({ success: true, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function markAttendance(req, res) {
  try {
    const { employeeId, date, checkInTime, checkOutTime, status } = req.body;
    
    if (!employeeId || !date) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and date are required"
      });
    }
    
    const hoursWorked = calculateHours(checkInTime, checkOutTime);
    
    const [record] = await db("attendance_records")
      .insert({
        employee_id: employeeId,
        attendance_date: date,
        check_in_time: checkInTime || null,
        check_out_time: checkOutTime || null,
        hours_worked: hoursWorked,
        status: status || "Present"
      })
      .returning("*");
    
    return res.json({
      success: true,
      message: "Attendance marked successfully",
      data: record
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateAttendance(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const record = await db("attendance_records").where({ id }).first();
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }
    
    if (updates.check_in_time || updates.check_out_time) {
      const checkIn = updates.check_in_time || record.check_in_time;
      const checkOut = updates.check_out_time || record.check_out_time;
      updates.hours_worked = calculateHours(checkIn, checkOut);
    }
    
    updates.updated_at = db.fn.now();
    
    const [updated] = await db("attendance_records")
      .where({ id })
      .update(updates)
      .returning("*");
    
    return res.json({
      success: true,
      message: "Attendance updated successfully",
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getAttendanceSummary(req, res) {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const targetId = employeeId || req.user.id;
    
    let query = db("attendance_records").where({ employee_id: targetId });
    
    if (startDate) query = query.where("attendance_date", ">=", startDate);
    if (endDate) query = query.where("attendance_date", "<=", endDate);
    
    const records = await query;
    
    const summary = {
      totalDays: records.length,
      present: records.filter(r => r.status === "Present").length,
      absent: records.filter(r => r.status === "Absent").length,
      halfDay: records.filter(r => r.status === "HalfDay").length,
      totalHoursWorked: records.reduce((sum, r) => sum + parseFloat(r.hours_worked || 0), 0)
    };
    
    if (summary.totalDays > 0) {
      summary.averageHoursPerDay = parseFloat((summary.totalHoursWorked / summary.totalDays).toFixed(2));
      summary.attendancePercentage = Math.round((summary.present / summary.totalDays) * 100);
    }
    
    return res.json({ success: true, data: summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAttendanceRecords,
  getDepartments,
  markAttendance,
  updateAttendance,
  getAttendanceSummary
};

