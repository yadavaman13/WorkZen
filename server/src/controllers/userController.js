const db = require('../config/db');

async function getProfileCompletion(req, res) {
  try {
    // req.user is the full user loaded in authMiddleware
    const fields = ['company_name', 'name', 'email', 'phone'];
    const filled = fields.filter((f) => req.user[f]).length;
    const completion = Math.floor((filled / fields.length) * 100);
    // update in DB for convenience
    await db('users').where({ id: req.user.id }).update({ profile_completion: completion });
    return res.json({ completion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function getMe(req, res) {
  try {
    const user = await db('users').where({ id: req.user.id }).first().select('id', 'employee_id', 'company_name', 'name', 'email', 'phone', 'role', 'status', 'profile_completion');
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { getProfileCompletion, getMe };
