import 'dotenv/config';

const base = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    timezone: '+02:00'
  },
  pool: { min: 1, max: 8 },
  migrations: { directory: './migrations' },
  seeds: { directory: './seeds' }
};

export default { development: base, production: base, test: { ...base, connection: { ...base.connection, database: process.env.DB_NAME_TEST || 'lbbs_test' } } };
