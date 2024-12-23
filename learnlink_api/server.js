import express from 'express'
import cors from 'cors'
import config from './config/env.js'
import pool from './config/database.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import assignmentRoutes from './routes/assignmentRoutes.js'
import contentRoutes from './routes/contentRoutes.js'
import { errorHandler } from './middleware/errorMiddleware.js'

const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LearnLink API' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/content', contentRoutes)

// Add this after your root route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: {
      connected: pool.totalCount > 0,
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingCount: pool.waitingCount
    }
  })
})

// Error Handling
app.use(errorHandler)

// Start Server
const startServer = async () => {
  try {
    console.log('Starting server...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database config:', {
      host: config.DB_HOST,
      port: config.DB_PORT,
      database: config.DB_NAME,
      user: config.DB_USER
    });

    const server = app.listen(config.PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${config.PORT}`)
    })

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.PORT} is already in use`)
      } else {
        console.error('Server error:', error)
      }
      process.exit(1)
    })
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer()