import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postRoutes from './routes/post.routes';
import aiRoutes from './routes/ai.routes';
import commentRoutes from './routes/comment.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';
import { setupSwagger } from './utils/swagger';

dotenv.config();

const app: Application = express();

// Swagger Setup
setupSwagger(app);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/posts', postRoutes);
app.use('/api/stt', aiRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Swell API is running' });
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
