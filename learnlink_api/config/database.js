import pg from 'pg'
import config from './env.js'

const pool = new pg.Pool({
  user: config.DB_USER,
  host: config.DB_HOST,
  database: config.DB_NAME,
  password: config.DB_PASSWORD,
  port: config.DB_PORT,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Add error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection and verify users table
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('Successfully connected to database');

    // Test query to verify users table
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (result.rows[0].exists) {

      
      // Count users
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      console.log(`Number of users in database: ${userCount.rows[0].count}`);
    } else {
      console.error('Users table does not exist!');
    }

  } catch (err) {
    console.error('Error testing database:', err);
    process.exit(-1);
  } finally {
    if (client) client.release();
  }
};

testConnection();

export default pool; 