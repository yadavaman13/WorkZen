const db = require('../config/db');

/**
 * Generate Employee ID in format:
 * [First 2 letters of company name][First 4 letters of full name][Year][Serial Number]
 * Example: ODARXX20259001
 * 
 * OD = Odoo (First 2 letters of Company Name)
 * ARXX = Arxx (First 4 letters of Employee Name)
 * 2025 = Year of Joining
 * 9001 = Serial Number for that year
 */
async function generateEmployeeId(companyName, fullName) {
  try {
    // Extract first 2 letters of company name
    const companyInitials = (companyName.trim().substring(0, 2) || 'XX').toUpperCase();

    // Extract first 4 letters of full name (remove spaces)
    const nameWithoutSpaces = fullName.trim().replace(/\s+/g, '');
    const nameInitials = (nameWithoutSpaces.substring(0, 4) || 'XXXX').toUpperCase().padEnd(4, 'X');

    // Get current year
    const year = new Date().getFullYear();

    // Get the highest serial number for this year across all employees
    // Query all employee IDs from the database
    const existingIds = await db('users')
      .whereNotNull('employee_id')
      .select('employee_id');

    console.log('Existing employee IDs:', existingIds.map(r => r.employee_id));

    let serialNumber = 1;
    if (existingIds.length > 0) {
      // Find the highest serial number from all IDs for this year
      let maxSerial = 0;
      for (const record of existingIds) {
        const id = record.employee_id;
        // Check if ID contains the year and has correct format (14 chars)
        if (id && id.length === 14 && id.includes(year.toString())) {
          const lastFourDigits = id.slice(-4);
          const serial = parseInt(lastFourDigits, 10);
          console.log(`ID: ${id}, Last 4: ${lastFourDigits}, Serial: ${serial}`);
          if (!isNaN(serial) && serial > maxSerial) {
            maxSerial = serial;
          }
        }
      }
      console.log(`Max serial found: ${maxSerial}, Next serial: ${maxSerial + 1}`);
      serialNumber = maxSerial + 1;
    } else {
      console.log('No existing employee IDs found, starting with 0001');
    }

    // Format serial number with leading zeros (4 digits)
    const serialStr = serialNumber.toString().padStart(4, '0');

    // Combine all parts
    const employeeId = `${companyInitials}${nameInitials}${year}${serialStr}`;

    console.log(`Generated Employee ID: ${employeeId} (Company: ${companyName}, Name: ${fullName})`);

    return employeeId;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    // Fallback to a random ID if generation fails
    const timestamp = Date.now();
    return `EMP${timestamp}`;
  }
}

module.exports = { generateEmployeeId };
