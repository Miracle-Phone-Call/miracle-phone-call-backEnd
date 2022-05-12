require('dotenv').config();
const { Pool } = require('pg')


const connectionDevelopment = {
  user: process.env.DB_USER,
  database: 'miracle-phone-call',
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: 5432
};

const connectionProduction = {
  connectionString: process.env.DATABASE_URL, 
  ssl: {rejectUnauthorized: false}
}

const pool = new Pool(process.env.NODE_ENV === 'production' ? connectionProduction : connectionDevelopment)

module.exports = pool;
 

