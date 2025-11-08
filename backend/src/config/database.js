import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'workzen_hrms'
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: '../../../database/migrations',
    extension: 'sql'
  }
});

export default db;
