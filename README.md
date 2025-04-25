# 🚀 LearnLink: Connect, Learn, and Grow Together

<div align="center">
  <img src="learnlink_gui/src/assets/images/learnlink-logo.png" alt="LearnLink Logo" width="200"/>
  <br>
  <p><em>A comprehensive full-stack educational platform designed to enhance the learning experience</em></p>
</div>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-development">Development</a> •
  <a href="#-license">License</a>
</p>

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

---

## ✨ Features

LearnLink is a comprehensive educational platform that bridges the gap between students and educators, providing a seamless and interactive learning experience. Key features include:

### 👨‍🏫 Course Management
- **Create & Manage Courses**: Instructors can create, manage, and organize course content
- **Enrollment**: Students can discover and join courses with ease
- **Content Delivery**: Rich course material with support for various media types

### 💬 Communication Tools
- **Real-time Chat**: Instant messaging between students and instructors
- **Discussion Forums**: Threaded discussions within courses
- **Chatrooms**: Topic-based group chats for collaborative learning
- **Direct Messages**: Private communication between users

### 📅 Planning & Organization
- **Events Calendar**: Schedule and track important dates and deadlines
- **Assignments**: Create, submit, and grade assignments with automated tracking
- **Progress Tracking**: Visual analytics to monitor learning progress

### 🔔 Smart Notifications
- **Real-time Alerts**: Stay updated with course announcements
- **Personalized Notifications**: Custom alerts based on user preferences
- **Multi-channel Delivery**: Receive notifications through the app or email

### 👥 Community & Social
- **User Profiles**: Customizable profiles to showcase achievements
- **Connections**: Build a network of peers and instructors
- **Collaboration Tools**: Work together on projects and assignments

### 🎨 Additional Features
- **Dark/Light Theme**: Customizable user interface for comfortable viewing
- **Responsive Design**: Optimized for both desktop and mobile experiences
- **File Sharing**: Seamless exchange of learning materials
- **Search Functionality**: Quickly find courses, content, and users

---

## 🛠 Tech Stack

LearnLink leverages a modern technology stack to deliver a robust, secure, and scalable educational platform:

### Frontend
- **React 19**: Latest React framework for building the user interface
- **TypeScript**: Strongly typed programming language for enhanced development
- **React Router**: Navigation and routing in the single-page application
- **Axios**: Promise-based HTTP client for API calls
- **Socket.IO Client**: Real-time communication
- **Chart.js**: Interactive data visualization and progress tracking
- **Material UI & React Icons**: Modern UI components and icons
- **Styled Components**: Component-level styling

### Backend
- **Node.js**: JavaScript runtime for building the API server
- **Express.js**: Web application framework for handling API requests
- **PostgreSQL**: Relational database for data storage
- **Socket.IO**: Real-time bidirectional event-based communication
- **JWT**: Secure authentication and authorization
- **Multer**: Middleware for handling file uploads
- **Nodemailer**: Module for sending emails

### Development & DevOps
- **ESLint & Prettier**: Code quality and formatting tools
- **Nodemon**: Automatic server restarts during development
- **Git**: Version control system
- **npm/pnpm**: Package managers for dependency management

---

## 🏗 Architecture

LearnLink follows a modern client-server architecture separated into two main components:

### Frontend (learnlink_gui)
- **Component-Based Structure**: Modular components for maximum reusability
- **Context API**: State management for authentication, notifications, and themes
- **Custom Hooks**: Separation of business logic from UI components
- **TypeScript Interfaces**: Strongly-typed data models and API responses
- **Responsive Design**: Adapts to different screen sizes and devices

### Backend (learnlink_api)
- **RESTful API**: Standard API design patterns for client-server communication
- **MVC Pattern**: Clear separation of models, controllers, and routes
- **Middleware Pipeline**: Authentication, validation, and error handling
- **Socket Service**: Real-time communication and notifications
- **Service Layer**: Business logic separated from controllers
- **Database Models**: PostgreSQL schema with relationships

---

## 🚀 Getting Started

Follow these instructions to get LearnLink up and running on your local machine.

### Prerequisites
- Node.js (v16 or newer)
- PostgreSQL (v12 or newer)
- npm or pnpm package manager

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/learnlink.git
cd learnlink

# Install backend dependencies
cd learnlink_api
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials and secrets

# Set up database
npm run db:setup

# Start the development server
npm run dev
```

### Frontend Setup
```bash
# In another terminal, navigate to frontend directory
cd ../learnlink_gui

# Install frontend dependencies
npm install

# Start the development server
npm start
```

The application will be available at `http://localhost:3000`.

---

## 📸 Screenshots

<div align="center">
  <p><strong>Dashboard View</strong></p>
  <img src="path/to/dashboard-screenshot.png" alt="Dashboard" width="80%"/>
  
  <p><strong>Course Detail Page</strong></p>
  <img src="path/to/course-detail-screenshot.png" alt="Course Detail" width="80%"/>
  
  <p><strong>Chat Interface</strong></p>
  <img src="path/to/chat-screenshot.png" alt="Chat Interface" width="80%"/>
</div>

---

## 👨‍💻 Development

### Project Structure

```
learnlink/
├── learnlink_api/         # Backend code
│   ├── config/            # Configuration files
│   ├── controllers/       # API controllers
│   ├── middleware/        # Express middlewares
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── socket/            # Socket.IO handlers
│   ├── uploads/           # Uploaded files storage
│   ├── utils/             # Utility functions
│   ├── app.js             # Express application setup
│   └── server.js          # Main server entry point
├── learnlink_gui/         # Frontend code
│   ├── public/            # Static assets
│   └── src/
│       ├── assets/        # Images, fonts, etc.
│       ├── components/    # React components
│       ├── context/       # React context providers
│       ├── hooks/         # Custom React hooks
│       ├── pages/         # Application pages
│       ├── services/      # API service functions
│       ├── styles/        # Global styles
│       ├── types/         # TypeScript type definitions
│       └── utils/         # Utility functions
└── README.md              # Project documentation
```

### API Endpoints

LearnLink provides a comprehensive API for all platform features:

- **/api/auth**: Authentication endpoints (login, register, reset password)
- **/api/users**: User profile management
- **/api/courses**: Course creation, enrollment, and management
- **/api/posts**: Course posts and content
- **/api/comments**: Discussion and comments
- **/api/events**: Events and calendar management
- **/api/assignments**: Assignment creation and submission
- **/api/chatrooms**: Group chat functionality
- **/api/messages**: Chat message handling
- **/api/notifications**: User notification management

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
  <p>LearnLink - Connect, Learn, and Grow Together</p>
</div> 