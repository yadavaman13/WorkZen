const db = require('../config/db');
const generateToken = require('../utils/generateToken');

async function requestRoleEscalation(req, res) {
  try {
    const { requested_role, reason } = req.body;
    if (!requested_role) return res.status(400).json({ msg: 'requested_role required' });
    await db('role_escalations').insert({ requester_id: req.user.id, requested_role, reason });
    await db('audit_logs').insert({ actor_id: req.user.id, action: `Requested role escalation to ${requested_role}`, target_id: req.user.id });
    return res.json({ msg: 'Escalation request sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function listEscalations(req, res) {
  try {
    const rows = await db('role_escalations').select('*').orderBy('created_at', 'desc');
    return res.json({ rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function reviewEscalation(req, res) {
  try {
    const { id, status } = req.body;
    if (!id || !['approved', 'rejected'].includes(status)) return res.status(400).json({ msg: 'Invalid payload' });
    await db('role_escalations').where({ id }).update({ status, reviewed_by: req.user.id, reviewed_at: db.fn.now() });
    if (status === 'approved') {
      const esc = await db('role_escalations').where({ id }).first();
      await db('users').where({ id: esc.requester_id }).update({ role: esc.requested_role });
      await db('audit_logs').insert({ actor_id: req.user.id, action: `Approved role escalation to ${esc.requested_role}`, target_id: esc.requester_id });
    } else {
      await db('audit_logs').insert({ actor_id: req.user.id, action: `Rejected role escalation id ${id}`, target_id: id });
    }
    return res.json({ msg: 'Escalation reviewed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function impersonateUser(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Unauthorized' });
    const { target_user_id } = req.body;
    if (!target_user_id) return res.status(400).json({ msg: 'target_user_id required' });
    const target = await db('users').where({ id: target_user_id }).first();
    if (!target) return res.status(404).json({ msg: 'Target not found' });
    if (target.status === 'suspended') return res.status(400).json({ msg: 'Cannot impersonate suspended user' });
    const tempToken = generateToken(target, '15m');
    await db('audit_logs').insert({ actor_id: req.user.id, action: `Impersonated user ${target.id}`, target_id: target.id });
    return res.json({ msg: `Now impersonating ${target.role}`, token: tempToken, user: { id: target.id, role: target.role, name: target.name } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function suspendUser(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Unauthorized' });
    const { userId, reason } = req.body;
    if (!userId) return res.status(400).json({ msg: 'userId required' });
    await db('users').where({ id: userId }).update({ status: 'suspended' });
    await db('audit_logs').insert({ actor_id: req.user.id, action: `Suspended user: ${reason || ''}`, target_id: userId });
    return res.json({ msg: 'User suspended' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function reactivateUser(req, res) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Unauthorized' });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ msg: 'userId required' });
    await db('users').where({ id: userId }).update({ status: 'active' });
    await db('audit_logs').insert({ actor_id: req.user.id, action: `Reactivated user`, target_id: userId });
    return res.json({ msg: 'User reactivated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { requestRoleEscalation, reviewEscalation, impersonateUser, suspendUser, reactivateUser, listEscalations };
