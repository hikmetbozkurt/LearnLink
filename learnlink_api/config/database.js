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

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack)
    return
  }
  client.query('SELECT NOW()', (err, result) => {
    release()
    if (err) {
      console.error('Error executing query', err.stack)
      return
    }
    console.log('Connected to database')
  })
})

export default pool 