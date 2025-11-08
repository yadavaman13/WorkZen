import db from '../config/database.js';
import logger from '../utils/logger.js';
import { generateEmployeeId, validateEmployeeIdFormat } from '../utils/employeeIdGenerator.js';
import { encrypt, decrypt } from '../utils/encryptionService.js';

/**
 * Get all employees (with pagination and filters)
 */
export const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, department, status } = req.query;
    const offset = (page - 1) * limit;

    let query = db('employees');

    if (department) {
      query = query.where('department', department);
    }

    if (status) {
      query = query.where('status', status);
    }

    const total = await query.clone().count('* as count').first();
    const employees = await query
      .limit(parseInt(limit))
      .offset(offset)
      .orderBy('created_at', 'desc');

    // Decrypt sensitive fields
    const decryptedEmployees = employees.map(emp => ({
      ...emp,
      pan: emp.pan ? decrypt(emp.pan) : null,
      aadhaar: emp.aadhaar ? decrypt(emp.aadhaar) : null,
      ifsc: emp.ifsc ? decrypt(emp.ifsc) : null
    }));

    res.json({
      data: decryptedEmployees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        pages: Math.ceil(total.count / limit)
      }
    });

    logger.info(`Retrieved ${employees.length} employees`);
  } catch (error) {
    logger.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get employee by ID
 */
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await db('employees').where('id', id).first();

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Decrypt sensitive fields
    const decryptedEmployee = {
      ...employee,
      pan: employee.pan ? decrypt(employee.pan) : null,
      aadhaar: employee.aadhaar ? decrypt(employee.aadhaar) : null,
      ifsc: employee.ifsc ? decrypt(employee.ifsc) : null
    };

    res.json(decryptedEmployee);
    logger.info(`Retrieved employee: ${id}`);
  } catch (error) {
    logger.error('Error fetching employee:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create new employee with auto-generated ID
 */
export const createEmployee = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      joining_date,
      pan,
      aadhaar,
      bank_account_number,
      ifsc,
      salary,
      status = 'active',
      company_code = 'OI'
    } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !department || !position || !joining_date) {
      return res.status(400).json({ 
        error: 'Missing required fields: first_name, last_name, email, department, position, joining_date' 
      });
    }

    // Check if email already exists
    const existingEmployee = await db('employees').where('email', email).first();
    if (existingEmployee) {
      return res.status(409).json({ error: 'Employee with this email already exists' });
    }

    // Generate unique Employee ID
    const employee_id = await generateEmployeeId(company_code);

    // Encrypt sensitive fields
    const encryptedData = {
      pan: pan ? encrypt(pan) : null,
      aadhaar: aadhaar ? encrypt(aadhaar) : null,
      ifsc: ifsc ? encrypt(ifsc) : null,
      bank_account_number: bank_account_number ? encrypt(bank_account_number) : null
    };

    const employeeData = {
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      joining_date: new Date(joining_date),
      ...encryptedData,
      salary: salary ? parseFloat(salary) : 0,
      status,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [id] = await db('employees').insert(employeeData);

    res.status(201).json({
      message: 'Employee created successfully',
      employee_id,
      id
    });

    logger.info(`Created new employee: ${employee_id}`);
  } catch (error) {
    logger.error('Error creating employee:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update employee details
 */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if employee exists
    const employee = await db('employees').where('id', id).first();
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Prevent updating employee_id
    delete updateData.employee_id;
    delete updateData.id;

    // Encrypt sensitive fields if provided
    if (updateData.pan) {
      updateData.pan = encrypt(updateData.pan);
    }
    if (updateData.aadhaar) {
      updateData.aadhaar = encrypt(updateData.aadhaar);
    }
    if (updateData.ifsc) {
      updateData.ifsc = encrypt(updateData.ifsc);
    }
    if (updateData.bank_account_number) {
      updateData.bank_account_number = encrypt(updateData.bank_account_number);
    }

    updateData.updated_at = new Date();

    await db('employees').where('id', id).update(updateData);

    res.json({ message: 'Employee updated successfully' });
    logger.info(`Updated employee: ${id}`);
  } catch (error) {
    logger.error('Error updating employee:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete employee (soft delete - mark as inactive)
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await db('employees').where('id', id).first();
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await db('employees')
      .where('id', id)
      .update({ 
        status: 'inactive',
        updated_at: new Date()
      });

    res.json({ message: 'Employee deactivated successfully' });
    logger.info(`Deactivated employee: ${id}`);
  } catch (error) {
    logger.error('Error deleting employee:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate new employee ID (manual endpoint for testing)
 */
export const generateNewEmployeeId = async (req, res) => {
  try {
    const { company_code = 'OI' } = req.body;

    const employee_id = await generateEmployeeId(company_code);

    res.json({
      employee_id,
      format: `${company_code}${new Date().getFullYear()}[0001-9999]`,
      generated_at: new Date().toISOString()
    });

    logger.info(`Generated new employee ID: ${employee_id}`);
  } catch (error) {
    logger.error('Error generating employee ID:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get employee statistics
 */
export const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await db('employees').count('* as count').first();
    const activeEmployees = await db('employees')
      .where('status', 'active')
      .count('* as count')
      .first();
    const byDepartment = await db('employees')
      .select('department')
      .count('* as count')
      .groupBy('department');
    const byStatus = await db('employees')
      .select('status')
      .count('* as count')
      .groupBy('status');

    res.json({
      total: totalEmployees.count,
      active: activeEmployees.count,
      inactive: totalEmployees.count - activeEmployees.count,
      byDepartment,
      byStatus
    });

    logger.info('Retrieved employee statistics');
  } catch (error) {
    logger.error('Error fetching employee statistics:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get employee by Employee ID
 */
export const getEmployeeByEmployeeId = async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (!validateEmployeeIdFormat(employee_id)) {
      return res.status(400).json({ error: 'Invalid employee ID format' });
    }

    const employee = await db('employees')
      .where('employee_id', employee_id)
      .first();

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
    logger.info(`Retrieved employee by ID: ${employee_id}`);
  } catch (error) {
    logger.error('Error fetching employee by ID:', error);
    res.status(500).json({ error: error.message });
  }
};
