// Build a full authentication and role-based access system for WorkZen HRMS using Express, PostgreSQL, and JWT.
// Include: registration, login, role-based dashboard redirection, profile completion indicator,
// role escalation (HR → Admin approval), admin impersonation, and account suspension/reactivation.
// Exclude password reset and 2FA modules.

// This file bootstraps the modular backend located in ./src
require('dotenv').config();
const path = require('path');

// Defer to src/index.js which contains the full Express app wiring
try {
  require(path.join(__dirname, 'src', 'index.js'));
} catch (err) {
  console.error('Failed to start server from ./src/index.js');
  console.error(err);
  process.exit(1);
}
