import express from 'express'
import cors from 'cors'
import config from './config/env.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import assignmentRoutes from './routes/assignmentRoutes.js'
import contentRoutes from './routes/contentRoutes.js'
import { errorHandler } from './middleware/errorMiddleware.js'

const app = express()

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/content', contentRoutes)

// Error Handling
app.use(errorHandler)

// Start Server
app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`)
}) 