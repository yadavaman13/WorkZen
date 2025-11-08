import 'dotenv/config.js';

const config = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'workzen_hrms'
    },
    migrations: {
      directory: './database/migrations',
      extension: 'sql'
    },
    seeds: {
      directory: './database/seeds',
      extension: 'js'
    }
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './database/migrations',
      extension: 'sql'
    },
    seeds: {
      directory: './database/seeds',
      extension: 'js'
    },
    ssl: { rejectUnauthorized: false }
  }
};

export default config;
