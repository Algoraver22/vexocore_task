# Task Manager App

A minimal task manager application with JWT authentication and CRUD operations.

## Features

- User authentication (register/login) with JWT
- Add, edit, delete tasks
- Toggle task completion status
- SQLite database for data persistence

## Setup

1. Install dependencies:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. Set environment variables in `backend/.env`:
```
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

3. Run development server:
```bash
npm run dev
```

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Options
- **Heroku**: Add Procfile and deploy
- **Render**: Connect GitHub repo and deploy
- **AWS**: Use Elastic Beanstalk or Lambda

## API Endpoints

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task