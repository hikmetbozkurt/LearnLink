import pool from '../config/database.js';

const migrate = async () => {
  try {
    console.log('Starting migration...');
    
    await pool.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS student_count INTEGER DEFAULT 0
    `);
    
    console.log('Migration successful');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
};

migrate(); 