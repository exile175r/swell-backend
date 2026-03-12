import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import prisma from './services/prisma.service';
import postRoutes from './routes/post.routes';
import aiRoutes from './routes/ai.routes';
import commentRoutes from './routes/comment.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';
import reportRoutes from './routes/report.routes';
import { setupSwagger } from './utils/swagger';

dotenv.config();

const app: Application = express();

// Swagger Setup
setupSwagger(app);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[Incoming Request] ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.body) {
    console.log('[Request Body Keys]', Object.keys(req.body));
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stt', aiRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Basic Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Swell API is running' });
});

// DB Connection Test
app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    res.status(200).json({
      success: true,
      message: 'Database Connection is OK!',
      userCount
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Database Connection Failed!',
      error: error.message
    });
  }
});

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

export default app;
