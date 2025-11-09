const db = require('../config/db');

// Helper function to calculate hours worked
function calculateHoursWorked(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  
  const checkInDate = new Date(`2000-01-01 ${checkIn}`);
  const checkOutDate = new Date(`2000-01-01 ${checkOut}`);
  
  const diffMs = checkOutDate - checkInDate;
  const hours = diffMs / (1000 * 60 * 60);
  
  return Math.max(0, parseFloat(hours.toFixed(2)));
}

// Helper function to check if employee is late
function isLateCheckIn(checkInTime, lateThreshold = '09:30:00') {
  const checkIn = new Date(`2000-01-01 ${checkInTime}`);
  const threshold = new Date(`2000-01-01 ${lateThreshold}`);
  
  if (checkIn > threshold) {
    const diffMinutes = Math.floor((checkIn - threshold) / 60000);
    return { isLate: true, lateByMinutes: diffMinutes };
  }
  
  return { isLate: false, lateByMinutes: 0 };
}

async function checkIn(req, res) {
  try {
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];
    
    const settings = await db('attendance_settings').first();
    const lateThreshold = settings?.late_threshold || '09:30:00';
    
    const existing = await db('attendance_records')
      .where({ employee_id: employeeId, attendance_date: today })
      .first();
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today'
      });
    }
    
    const { isLate, lateByMinutes } = isLateCheckIn(currentTime, lateThreshold);
    const checkInIp = req.ip || req.connection.remoteAddress;
    const checkInLocation = req.body.location || null;
    
    const [record] = await db('attendance_records')
      .insert({
        employee_id: employeeId,
        attendance_date: today,
        check_in_time: currentTime,
        status: 'Present',
        is_late: isLate,
        late_by_minutes: lateByMinutes,
        check_in_ip: checkInIp,
        check_in_location: checkInLocation
      })
      .returning('*');
    
    await db('audit_logs').insert({
      actor_id: employeeId,
      action: `Checked in at ${currentTime}${isLate ? ` (Late by ${lateByMinutes} mins)` : ''}`,
      target_id: record.id
    });
    
    return res.json({
      success: true,
      message: `Checked in successfully${isLate ? ` (Late by ${lateByMinutes} minutes)` : ''}`,
      data: record
    });
    
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check in',
      error: error.message
    });
  }
}

module.exports = { checkIn, calculateHoursWorked, isLateCheckIn };
