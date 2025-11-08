const knex = require('knex');
const dotenv = require('dotenv');
dotenv.config();

// Fix: when DATABASE_URL is set, use it directly as connection string
// Otherwise use individual connection properties
const connectionConfig = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'workzen',
    };

const knexInstance = knex({
  client: 'pg',
  connection: connectionConfig,
  pool: { min: 0, max: 10 },
});

async function init() {
  // create tables if they do not exist
  const hasUsers = await knexInstance.schema.hasTable('users');
  if (!hasUsers) {
    await knexInstance.schema.createTable('users', (t) => {
      t.increments('id').primary();
      t.string('employee_id', 50).unique();
      t.string('company_name', 150);
      t.string('name', 100);
      t.string('email', 100).notNullable().unique();
      t.string('phone', 20);
      t.string('password', 255).notNullable();
      t.string('role', 20).defaultTo('employee');
      t.string('status', 20).defaultTo('active');
      t.integer('profile_completion').defaultTo(0);
      t.timestamp('created_at').defaultTo(knexInstance.fn.now());
    });
  } else {
    // Add new columns if table exists but columns don't
    const hasEmployeeId = await knexInstance.schema.hasColumn('users', 'employee_id');
    if (!hasEmployeeId) {
      await knexInstance.schema.table('users', (t) => {
        t.string('employee_id', 50).unique();
      });
    }
    const hasCompanyName = await knexInstance.schema.hasColumn('users', 'company_name');
    if (!hasCompanyName) {
      await knexInstance.schema.table('users', (t) => {
        t.string('company_name', 150);
      });
    }
    const hasPhone = await knexInstance.schema.hasColumn('users', 'phone');
    if (!hasPhone) {
      await knexInstance.schema.table('users', (t) => {
        t.string('phone', 20);
      });
    }
  }

  const hasEsc = await knexInstance.schema.hasTable('role_escalations');
  if (!hasEsc) {
    await knexInstance.schema.createTable('role_escalations', (t) => {
      t.increments('id').primary();
      t.integer('requester_id').unsigned().references('id').inTable('users');
      t.string('requested_role', 20);
      t.text('reason');
      t.string('status', 20).defaultTo('pending');
      t.integer('reviewed_by').unsigned().references('id').inTable('users');
      t.timestamp('reviewed_at');
      t.timestamp('created_at').defaultTo(knexInstance.fn.now());
    });
  }

  const hasAudit = await knexInstance.schema.hasTable('audit_logs');
  if (!hasAudit) {
    await knexInstance.schema.createTable('audit_logs', (t) => {
      t.increments('id').primary();
      t.integer('actor_id').unsigned().references('id').inTable('users');
      t.text('action');
      t.integer('target_id');
      t.timestamp('created_at').defaultTo(knexInstance.fn.now());
    });
  }

  return;
}

module.exports = knexInstance;
module.exports.init = init;
