import express from 'express'
import cors from 'cors'
import config from './config/env.js'
import authRoutes from './routes/authRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import chatRoutes from './routes/chatRoutes.js'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Mount auth routes
app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/chat', chatRoutes)

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: 'Something broke!' })
})

const startServer = async () => {
  try {
    app.listen(config.PORT, () => {
      console.log(`Server running on port ${config.PORT}`)
    })
  } catch (error) {
    console.error('Server startup error:', error)
    process.exit(1)
  }
}

startServer()