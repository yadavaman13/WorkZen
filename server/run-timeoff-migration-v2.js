const knex = require('./src/config/db');

async function runMigration() {
  try {
    console.log('🔄 Running time_off_requests migration...');
    console.log('📍 Database:', process.env.DB_NAME || 'workzen');
    
    // Create time_off_requests table
    const hasTimeOff = await knex.schema.hasTable('time_off_requests');
    if (!hasTimeOff) {
      console.log('📝 Creating time_off_requests table...');
      await knex.schema.createTable('time_off_requests', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('employee_name', 255).notNullable();
        table.enum('leave_type', ['Paid', 'Sick', 'Unpaid', 'Emergency']).notNullable();
        table.date('from_date').notNullable();
        table.date('to_date').notNullable();
        table.enum('duration_type', ['Full Day', 'Half Day']).notNullable();
        table.text('reason').notNullable();
        table.string('contact_number', 15).notNullable();
        table.string('document_path', 500);
        table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
        table.string('balance_before', 50);
        table.string('balance_after', 50);
        table.integer('team_members_on_leave').defaultTo(0);
        table.enum('workload_risk', ['Low', 'Medium', 'High']).defaultTo('Low');
        table.string('productivity_impact', 50);
        table.string('payroll_impact', 50);
        table.enum('critical_role_flag', ['Yes', 'No']).defaultTo('No');
        table.integer('approved_by').references('id').inTable('users').onDelete('SET NULL');
        table.timestamp('approved_at');
        table.integer('rejected_by').references('id').inTable('users').onDelete('SET NULL');
        table.timestamp('rejected_at');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        
        // Indexes
        table.index('user_id', 'idx_time_off_user_id');
        table.index('status', 'idx_time_off_status');
        table.index(['from_date', 'to_date'], 'idx_time_off_dates');
        table.index('leave_type', 'idx_time_off_leave_type');
      });
      console.log('✅ time_off_requests table created!');
    } else {
      console.log('ℹ️  time_off_requests table already exists');
    }

    // Create leave_balances table
    const hasBalance = await knex.schema.hasTable('leave_balances');
    if (!hasBalance) {
      console.log('📝 Creating leave_balances table...');
      await knex.schema.createTable('leave_balances', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('paid_leave_balance').defaultTo(24);
        table.integer('sick_leave_balance').defaultTo(7);
        table.integer('year').defaultTo(knex.raw('EXTRACT(YEAR FROM CURRENT_DATE)'));
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        
        // Unique constraint
        table.unique(['user_id', 'year']);
        
        // Index
        table.index(['user_id', 'year'], 'idx_leave_balance_user_year');
      });
      console.log('✅ leave_balances table created!');
    } else {
      console.log('ℹ️  leave_balances table already exists');
    }

    // Create function and triggers using raw SQL
    console.log('📝 Creating triggers...');
    try {
      await knex.raw(`
        CREATE OR REPLACE FUNCTION update_time_off_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      await knex.raw(`
        DROP TRIGGER IF EXISTS trigger_update_time_off_updated_at ON time_off_requests;
      `);
      
      await knex.raw(`
        CREATE TRIGGER trigger_update_time_off_updated_at
            BEFORE UPDATE ON time_off_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_time_off_updated_at();
      `);

      await knex.raw(`
        DROP TRIGGER IF EXISTS trigger_update_leave_balance_updated_at ON leave_balances;
      `);

      await knex.raw(`
        CREATE TRIGGER trigger_update_leave_balance_updated_at
            BEFORE UPDATE ON leave_balances
            FOR EACH ROW
            EXECUTE FUNCTION update_time_off_updated_at();
      `);
      console.log('✅ Triggers created!');
    } catch (error) {
      console.log('⚠️  Triggers might already exist');
    }

    // Insert default leave balances for existing users
    console.log('📝 Creating default leave balances for existing users...');
    await knex.raw(`
      INSERT INTO leave_balances (user_id, paid_leave_balance, sick_leave_balance, year)
      SELECT id, 24, 7, EXTRACT(YEAR FROM CURRENT_DATE)::integer
      FROM users
      WHERE id NOT IN (
        SELECT user_id FROM leave_balances 
        WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)::integer
      )
      ON CONFLICT (user_id, year) DO NOTHING
    `);
    console.log('✅ Default balances created!');
    
    console.log('\n✅ Migration completed successfully!');
    
    // Check table structure
    const timeOffColumns = await knex('time_off_requests').columnInfo();
    console.log('📋 time_off_requests columns:', Object.keys(timeOffColumns).join(', '));
    
    const balanceColumns = await knex('leave_balances').columnInfo();
    console.log('📋 leave_balances columns:', Object.keys(balanceColumns).join(', '));
    
    // Count records
    const balanceCount = await knex('leave_balances').count('* as count').first();
    console.log('📊 Leave balance records created:', balanceCount.count);
    
    await knex.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    await knex.destroy();
    process.exit(1);
  }
}

runMigration();
