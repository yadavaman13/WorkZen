const db = require("../config/db");

// Get all attendance records with filters
exports.getAttendance = async (req, res) => {
  try {
    const { date, employee_id, status, start_date, end_date, department } =
      req.query;

    let query = db("attendance")
      .join("employees", "attendance.employee_id", "employees.id")
      .leftJoin("users", "attendance.marked_by", "users.id")
      .select(
        "attendance.*",
        "employees.first_name",
        "employees.last_name",
        "employees.employee_code",
        "employees.department",
        "employees.email as employee_email",
        db.raw("users.name as marked_by_name")
      )
      .orderBy("attendance.attendance_date", "desc");

    // Apply filters
    if (date) {
      query = query.where("attendance.attendance_date", date);
    }

    if (employee_id) {
      query = query.where("attendance.employee_id", employee_id);
    }

    if (status) {
      query = query.where("attendance.status", status);
    }

    if (start_date && end_date) {
      query = query.whereBetween("attendance.attendance_date", [
        start_date,
        end_date,
      ]);
    }

    if (department) {
      query = query.where("employees.department", department);
    }

    const records = await query;

    res.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (err) {
    console.error("Get attendance error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to fetch attendance records",
      error: err.message,
    });
  }
};

// Get attendance statistics
exports.getAttendanceStats = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split("T")[0];

    const stats = await db("attendance")
      .where("attendance_date", targetDate)
      .select("status")
      .count("* as count")
      .groupBy("status");

    const totalEmployees = await db("employees")
      .where("status", "active")
      .count("* as count")
      .first();

    const statsMap = {
      present: 0,
      absent: 0,
      half_day: 0,
      on_leave: 0,
      sick_leave: 0,
    };

    stats.forEach((s) => {
      statsMap[s.status] = parseInt(s.count);
    });

    res.json({
      success: true,
      data: {
        ...statsMap,
        total: parseInt(totalEmployees?.count || 0),
        date: targetDate,
      },
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to fetch attendance statistics",
      error: err.message,
    });
  }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const {
      employee_id,
      attendance_date,
      status,
      check_in_time,
      check_out_time,
      notes,
    } = req.body;

    const marked_by = req.user?.id;

    // Validate required fields
    if (!employee_id || !attendance_date || !status) {
      return res.status(400).json({
        success: false,
        msg: "Employee ID, date, and status are required",
      });
    }

    // Calculate duration if both times provided
    let duration_hours = null;
    if (check_in_time && check_out_time) {
      const checkIn = new Date(check_in_time);
      const checkOut = new Date(check_out_time);
      const diffMs = checkOut - checkIn;
      duration_hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
    }

    // Check if attendance already exists
    const existing = await db("attendance")
      .where({ employee_id, attendance_date })
      .first();

    let record;
    if (existing) {
      // Update existing record
      await db("attendance").where({ employee_id, attendance_date }).update({
        status,
        check_in_time,
        check_out_time,
        duration_hours,
        notes,
        marked_by,
        updated_at: db.fn.now(),
      });

      record = await db("attendance")
        .where({ employee_id, attendance_date })
        .first();
    } else {
      // Create new record
      const [id] = await db("attendance").insert({
        employee_id,
        attendance_date,
        status,
        check_in_time,
        check_out_time,
        duration_hours,
        notes,
        marked_by,
      });

      record = await db("attendance").where({ id }).first();
    }

    res.json({
      success: true,
      msg: "Attendance marked successfully",
      data: record,
    });
  } catch (err) {
    console.error("Mark attendance error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to mark attendance",
      error: err.message,
    });
  }
};

// Bulk mark attendance
exports.bulkMarkAttendance = async (req, res) => {
  try {
    const { records } = req.body;
    const marked_by = req.user?.id;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Records array is required",
      });
    }

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        const {
          employee_id,
          attendance_date,
          status,
          check_in_time,
          check_out_time,
          notes,
        } = record;

        let duration_hours = null;
        if (check_in_time && check_out_time) {
          const checkIn = new Date(check_in_time);
          const checkOut = new Date(check_out_time);
          const diffMs = checkOut - checkIn;
          duration_hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
        }

        const existing = await db("attendance")
          .where({ employee_id, attendance_date })
          .first();

        if (existing) {
          await db("attendance")
            .where({ employee_id, attendance_date })
            .update({
              status,
              check_in_time,
              check_out_time,
              duration_hours,
              notes,
              marked_by,
              updated_at: db.fn.now(),
            });
        } else {
          await db("attendance").insert({
            employee_id,
            attendance_date,
            status,
            check_in_time,
            check_out_time,
            duration_hours,
            notes,
            marked_by,
          });
        }

        results.push({ employee_id, attendance_date, success: true });
      } catch (err) {
        errors.push({
          employee_id: record.employee_id,
          error: err.message,
        });
      }
    }

    res.json({
      success: true,
      msg: `Marked attendance for ${results.length} employees`,
      data: {
        success: results,
        errors,
      },
    });
  } catch (err) {
    console.error("Bulk mark error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to mark bulk attendance",
      error: err.message,
    });
  }
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await db("attendance").where({ id }).del();

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        msg: "Attendance record not found",
      });
    }

    res.json({
      success: true,
      msg: "Attendance record deleted successfully",
    });
  } catch (err) {
    console.error("Delete attendance error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to delete attendance record",
      error: err.message,
    });
  }
};

// Get employee attendance report
exports.getEmployeeReport = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        msg: "Start date and end date are required",
      });
    }

    const records = await db("attendance")
      .where("employee_id", employee_id)
      .whereBetween("attendance_date", [start_date, end_date])
      .orderBy("attendance_date", "asc");

    const stats = await db("attendance")
      .where("employee_id", employee_id)
      .whereBetween("attendance_date", [start_date, end_date])
      .select("status")
      .count("* as count")
      .groupBy("status");

    const statsMap = {};
    stats.forEach((s) => {
      statsMap[s.status] = parseInt(s.count);
    });

    const totalHours = await db("attendance")
      .where("employee_id", employee_id)
      .whereBetween("attendance_date", [start_date, end_date])
      .sum("duration_hours as total")
      .first();

    res.json({
      success: true,
      data: {
        records,
        statistics: statsMap,
        total_hours: parseFloat(totalHours?.total || 0),
      },
    });
  } catch (err) {
    console.error("Get employee report error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to fetch employee report",
      error: err.message,
    });
  }
};
