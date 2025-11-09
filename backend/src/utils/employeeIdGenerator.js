import db from '../config/database.js';

/**
 * Generate Employee ID in format: [2-letter company code][YYYY][serial number]
 * Example: OI20250001
 * OI = Company code (Org India or configurable)
 * 2025 = Year of joining
 * 0001 = Serial number for that year
 */
export const generateEmployeeId = async (companyCode = 'OI') => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get the count of employees hired in the current year
    const result = await db('employees')
      .whereRaw(`EXTRACT(YEAR FROM date_of_joining) = ?`, [currentYear])
      .count('* as count')
      .first();

    const serialNumber = (parseInt(result.count) + 1).toString().padStart(4, '0');
    const employeeId = `${companyCode}${currentYear}${serialNumber}`;

    // Verify uniqueness (in case of race conditions)
    const exists = await db('employees')
      .where('employee_id', employeeId)
      .first();

    if (exists) {
      // Recursively generate new ID if duplicate
      return generateEmployeeId(companyCode);
    }

    return employeeId;
  } catch (error) {
    console.error('Error generating employee ID:', error);
    throw new Error('Failed to generate employee ID');
  }
};

/**
 * Get Employee ID format information
 */
export const getEmployeeIdFormat = () => {
  return {
    format: '[2-letter code][YYYY][serial]',
    example: 'OI20250001',
    description: 'OI = Company code, 2025 = Year, 0001 = Serial number'
  };
};

/**
 * Validate Employee ID format
 */
export const validateEmployeeIdFormat = (employeeId) => {
  const pattern = /^[A-Z]{2}\d{4}\d{4}$/;
  return pattern.test(employeeId);
};
