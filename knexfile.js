require('dotenv').config();

 module.exports = {
  development: {
    client: 'pg',
    connection: {
      database: 'miracle-phone-call',
      user: process.env.DB_USER,
      password: process.env.DB_PASS
    }
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: {rejectUnauthorized: false}
    }
  }
};

