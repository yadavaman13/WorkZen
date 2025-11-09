const knex = require("knex");
const dotenv = require("dotenv");
dotenv.config();

// Fix: when DATABASE_URL is set, use it directly as connection string
// Otherwise use individual connection properties
const connectionConfig = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : {
      host: process.env.DB_HOST || "127.0.0.1",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "admin",
      database: process.env.DB_NAME || "workzen",
    };

const knexInstance = knex({
  client: "pg",
  connection: connectionConfig,
  pool: { min: 0, max: 10 },
});

async function init() {
  // create tables if they do not exist
  const hasUsers = await knexInstance.schema.hasTable("users");
  if (!hasUsers) {
    await knexInstance.schema.createTable("users", (t) => {
      t.increments("id").primary();
      t.string("employee_id", 50).unique();
      t.string("company_name", 150);
      t.string("name", 100);
      t.string("email", 100).notNullable().unique();
      t.string("phone", 20);
      t.string("password", 255).notNullable();
      t.string("role", 20).defaultTo("employee");
      t.string("status", 20).defaultTo("active");
      t.integer("profile_completion").defaultTo(0);
      t.timestamp("created_at").defaultTo(knexInstance.fn.now());
    });
  } else {
    // Add new columns if table exists but columns don't
    const hasEmployeeId = await knexInstance.schema.hasColumn(
      "users",
      "employee_id"
    );
    if (!hasEmployeeId) {
      await knexInstance.schema.table("users", (t) => {
        t.string("employee_id", 50).unique();
      });
    }
    const hasCompanyName = await knexInstance.schema.hasColumn(
      "users",
      "company_name"
    );
    if (!hasCompanyName) {
      await knexInstance.schema.table("users", (t) => {
        t.string("company_name", 150);
      });
    }
    const hasPhone = await knexInstance.schema.hasColumn("users", "phone");
    if (!hasPhone) {
      await knexInstance.schema.table("users", (t) => {
        t.string("phone", 20);
      });
    }
  }

  const hasEsc = await knexInstance.schema.hasTable("role_escalations");
  if (!hasEsc) {
    await knexInstance.schema.createTable("role_escalations", (t) => {
      t.increments("id").primary();
      t.integer("requester_id").unsigned().references("id").inTable("users");
      t.string("requested_role", 20);
      t.text("reason");
      t.string("status", 20).defaultTo("pending");
      t.integer("reviewed_by").unsigned().references("id").inTable("users");
      t.timestamp("reviewed_at");
      t.timestamp("created_at").defaultTo(knexInstance.fn.now());
    });
  }

  const hasAudit = await knexInstance.schema.hasTable("audit_logs");
  if (!hasAudit) {
    await knexInstance.schema.createTable("audit_logs", (t) => {
      t.increments("id").primary();
      t.integer("actor_id").unsigned().references("id").inTable("users");
      t.text("action");
      t.integer("target_id");
      t.timestamp("created_at").defaultTo(knexInstance.fn.now());
    });
  }

  const hasPasswordResets = await knexInstance.schema.hasTable(
    "password_resets"
  );
  if (!hasPasswordResets) {
    await knexInstance.schema.createTable("password_resets", (t) => {
      t.increments("id").primary();
      t.string("email", 255).notNullable();
      t.string("token", 255).notNullable();
      t.timestamp("expires_at").notNullable();
      t.boolean("used").defaultTo(false);
      t.timestamp("created_at").defaultTo(knexInstance.fn.now());
    });
  }

  // Create employees table for attendance reference
  const hasEmployees = await knexInstance.schema.hasTable("employees");
  if (!hasEmployees) {
    await knexInstance.schema.createTable("employees", (t) => {
      t.increments("id").primary();
      t.integer("user_id")
        .unsigned()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.string("employee_code", 50).unique();
      t.string("first_name", 100).notNullable();
      t.string("last_name", 100).notNullable();
      t.string("department", 100);
      t.string("position", 100);
      t.string("email", 100).notNullable();
      t.string("phone", 20);
      t.string("status", 20).defaultTo("active");
      t.date("date_of_joining");
      t.timestamp("created_at").defaultTo(knexInstance.fn.now());
      t.timestamp("updated_at").defaultTo(knexInstance.fn.now());
    });
  }

  // Create attendance table
  const hasAttendance = await knexInstance.schema.hasTable("attendance");
  if (!hasAttendance) {
    await knexInstance.schema.createTable("attendance", (t) => {
      t.increments("id").primary();
      t.integer("employee_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("employees")
        .onDelete("CASCADE");
      t.date("attendance_date").notNullable();
      t.string("status", 50)
        .notNullable()
        .checkIn(["present", "absent", "half_day", "on_leave", "sick_leave"]);
      t.timestamp("check_in_time");
      t.timestamp("check_out_time");
      t.decimal("duration_hours", 5, 2);
      t.text("notes");
      t.integer("marked_by")
        .unsigned()
        .references("id")
        .inTable("users")
        .onDelete("SET NULL");
      t.timestamp("created_at").defaultTo(knexInstance.fn.now());
      t.timestamp("updated_at").defaultTo(knexInstance.fn.now());

      t.unique(["employee_id", "attendance_date"]);
      t.index("employee_id", "idx_employee");
      t.index("attendance_date", "idx_date");
      t.index("status", "idx_status");
    });
  }

  return;
}

module.exports = knexInstance;
module.exports.init = init;
