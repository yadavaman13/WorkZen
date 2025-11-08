/**
 * Database Migration Runner
 * This script applies migrations to the database
 */

import db from './src/config/database.js';
import logger from './src/utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    // Create roles table
    await db.raw(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    logger.info('✓ Roles table created');

    // Create employee_id_sequences table
    await db.raw(`
      CREATE TABLE IF NOT EXISTS employee_id_sequences (
        id SERIAL PRIMARY KEY,
        company_code VARCHAR(2) NOT NULL,
        year INTEGER NOT NULL,
        last_serial INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(company_code, year)
      );
    `);
    logger.info('✓ Employee ID sequences table created');

    // Insert default roles
    await db('roles').insert([
      { name: 'admin', description: 'System administrator with full access' },
      { name: 'hr_officer', description: 'HR staff for recruiting and employee management' },
      { name: 'manager', description: 'Department manager with team oversight' },
      { name: 'employee', description: 'Regular employee with limited access' },
      { name: 'contractor', description: 'Temporary contractor with minimal access' }
    ]).onConflict('name').ignore();
    logger.info('✓ Default roles inserted');

    logger.info('✓ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
