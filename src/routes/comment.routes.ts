import { Router } from 'express';
import { likeComment } from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Notice: createComment is usually called via /posts/:id/comments (in post.routes.ts)
// But likeComment is called directly on comment ID
router.post('/:id/like', authenticate, likeComment);

export default router;
