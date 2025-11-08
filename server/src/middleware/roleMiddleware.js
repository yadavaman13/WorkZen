function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: 'Not authenticated' });
    if (allowedRoles.includes(req.user.role) || allowedRoles.includes('any')) return next();
    return res.status(403).json({ msg: 'Forbidden: insufficient role' });
  };
}

module.exports = { authorizeRoles };
