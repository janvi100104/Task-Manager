# Cleaner - Task Management System

A modern, full-stack task management application built with the MERN stack, featuring a clean UI, drag-and-drop functionality, and real-time updates.

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Task Management**: Full CRUD operations for tasks with priority levels
- **Priority Board**: Visual Kanban-style board with color-coded priorities
- **Real-time Updates**: Optimistic updates with React Query
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Modern UI**: Clean components using shadcn/ui
- **TypeScript**: Full type safety across frontend and backend

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for beautiful, accessible components
- **React Query** for server state management
- **React Hook Form** with Zod validation
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** authentication with refresh tokens
- **bcrypt** for password hashing
- **Express Rate Limiting** for security
- **Comprehensive validation** with express-validator

## 📁 Project Structure

```
Task Manager/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utilities (JWT, colors)
│   │   └── server.js       # Express app entry point
│   ├── package.json
│   └── .env.example
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── hooks/          # Custom hooks (React Query)
│   │   ├── lib/            # API client and utilities
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript type definitions
│   │   └── main.tsx        # React entry point
│   ├── package.json
│   └── .env.local
├── package.json            # Workspace configuration
└── README.md
```

## 🏗️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Task Manager"
```

### 2. Install Dependencies
```bash
# Install workspace dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

#### Backend (.env)
Create `backend/.env` file (copy from `.env.example`):
```env
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/cleaner-task-manager

# JWT Secrets (Change these in production!)
JWT_ACCESS_SECRET=your-super-secret-access-token-here-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-here-change-in-production

# Token Expiration
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env.local)
Create `frontend/.env.local` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start the Application

#### Development Mode (Both servers)
```bash
# From the root directory
npm run dev
```

#### Or start individually:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## 🎯 Usage

### Getting Started
1. **Register** a new account or **Login** with existing credentials
2. **Create tasks** using the "Add Task" button
3. **Organize tasks** by priority (High, Medium, Low, Backlog)
4. **Update task status** by clicking the status icon
5. **View task details** by clicking on any task card
6. **Edit or delete** tasks using the action buttons

### Task Management
- **Priority Levels:** High (Red), Medium (Amber), Low (Green), Backlog (Indigo)
- **Status Types:** Pending, In Progress, Completed
- **Due Dates:** Optional with overdue indicators
- **Tags:** Categorize tasks with custom tags
- **Assignees:** Assign tasks to team members

## 🔐 API Endpoints

### Authentication
```
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login user
POST /api/auth/refresh     # Refresh access token
POST /api/auth/logout      # Logout user
GET  /api/auth/me          # Get current user
PUT  /api/auth/me          # Update user profile
```

### Tasks
```
GET    /api/tasks          # Get tasks with filters
POST   /api/tasks          # Create new task
GET    /api/tasks/:id      # Get task by ID
PUT    /api/tasks/:id      # Update task
DELETE /api/tasks/:id      # Delete task
PATCH  /api/tasks/:id/status   # Update task status
PATCH  /api/tasks/:id/priority # Update task priority
GET    /api/tasks/stats    # Get task statistics
```

### Users
```
GET /api/users             # Get users (for assignee dropdown)
GET /api/users/:id         # Get user by ID
```

## 🚀 Production Deployment

### Backend Deployment
1. **Environment Variables:** Set all required environment variables
2. **Database:** Use MongoDB Atlas or hosted MongoDB
3. **Security:** Use strong JWT secrets and enable rate limiting
4. **Platform:** Deploy to Heroku, Railway, or similar

### Frontend Deployment
1. **Build:** Run `npm run build` in frontend directory
2. **Environment:** Set `VITE_API_URL` to production API URL
3. **Platform:** Deploy to Vercel, Netlify, or similar

### Docker (Optional)
```dockerfile
# Example Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Manual Testing
1. **Authentication Flow:** Register → Login → Logout
2. **Task Operations:** Create → Read → Update → Delete
3. **Real-time Updates:** Multiple browser tabs
4. **Responsive Design:** Different screen sizes
5. **Error Handling:** Network failures, validation errors

## 📚 Key Features Explained

### JWT Authentication
- **Access Tokens:** Short-lived (15 minutes) for API requests
- **Refresh Tokens:** Long-lived (7 days) stored in httpOnly cookies
- **Automatic Refresh:** Seamless token renewal on expiry

### Task Priority System
- **Visual Indicators:** Color-coded priority levels
- **Board Layout:** Kanban-style columns for each priority
- **Drag & Drop:** Move tasks between priorities (coming soon)

### Real-time Updates
- **Optimistic Updates:** Instant UI feedback
- **Cache Management:** Smart cache invalidation
- **Error Recovery:** Automatic rollback on failures

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file
   - Verify network connectivity

2. **JWT Token Errors**
   - Check JWT secrets in .env
   - Clear browser localStorage
   - Restart the server

3. **CORS Issues**
   - Verify FRONTEND_URL in backend .env
   - Check if both servers are running

4. **Port Already in Use**
   - Change PORT in backend .env
   - Kill existing processes: `lsof -ti:5000 | xargs kill`

### Debug Mode
Enable detailed logging:
```env
NODE_ENV=development
DEBUG=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful UI components
- **Tailwind CSS** for utility-first styling
- **React Query** for excellent server state management
- **MongoDB** for flexible document storage

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**Happy Task Managing! 🎉**