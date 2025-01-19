import { Pool } from 'pg';

// Get the connection string from Supabase dashboard
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
    servername: process.env.DB_HOST
  }
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully!');
  }
});

export default pool; 