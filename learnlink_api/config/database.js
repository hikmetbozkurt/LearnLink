import pg from "pg";
import config from "./env.js";

const pool = new pg.Pool({
  user: config.DB_USER,
  host: config.DB_HOST,
  database: config.DB_NAME,
  password: config.DB_PASSWORD,
  port: config.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    client.release();
  } catch (err) {
    console.error("Database connection error:", err);
  }
};

testConnection();

export default pool;
