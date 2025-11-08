const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const generateToken = require('../utils/generateToken');
const { generateEmployeeId } = require('../utils/generateEmployeeId');

async function register(req, res) {
  try {
    const { companyName, name, email, phone, password } = req.body;
    
    // Validation
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ msg: 'Company name is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ msg: 'Email is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ msg: 'Invalid email format' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ msg: 'Phone number is required' });
    }
    if (!/^\d{10}$/.test(phone.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ msg: 'Phone number must be 10 digits' });
    }
    if (!password) {
      return res.status(400).json({ msg: 'Password is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }
    
    const existing = await db('users').where({ email }).first();
    if (existing) return res.status(400).json({ msg: 'Email already in use' });
    
    // Generate employee ID
    const employeeId = await generateEmployeeId(companyName, name);
    
    const hashed = await hashPassword(password);
    const [user] = await db('users').insert({ 
      employee_id: employeeId,
      company_name: companyName,
      name, 
      email, 
      phone,
      password: hashed 
    }).returning(['id', 'employee_id', 'name', 'email', 'role', 'status', 'company_name', 'phone']);
    
    // log
    await db('audit_logs').insert({ actor_id: user.id, action: 'User registered', target_id: user.id });
    const token = generateToken(user);
    return res.json({ user, token, redirect: determineRedirect(user.role) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !email.trim()) {
      return res.status(400).json({ msg: 'Email is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ msg: 'Invalid email format' });
    }
    if (!password) {
      return res.status(400).json({ msg: 'Password is required' });
    }
    
    const user = await db('users').where({ email }).first();
    if (!user) return res.status(401).json({ msg: 'Invalid credentials' });
    if (user.status === 'suspended') return res.status(403).json({ msg: 'Account suspended' });
    
    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(401).json({ msg: 'Invalid credentials' });
    
    const token = generateToken(user);
    await db('audit_logs').insert({ actor_id: user.id, action: 'User logged in', target_id: user.id });
    
    return res.json({ 
      user: { 
        id: user.id,
        employee_id: user.employee_id,
        name: user.name, 
        email: user.email, 
        role: user.role, 
        company_name: user.company_name,
        phone: user.phone 
      }, 
      token, 
      redirect: determineRedirect(user.role) 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

function determineRedirect(role) {
  if (role === 'admin') return '/dashboard/admin';
  if (role === 'hr') return '/dashboard/hr';
  if (role === 'payroll') return '/dashboard/payroll';
  return '/dashboard/employee';
}

module.exports = { register, login };
