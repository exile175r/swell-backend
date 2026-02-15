import { Router } from 'express';
import { likeComment } from '../controllers/comment.controller';

const router = Router();

// Notice: createComment is usually called via /posts/:id/comments
// But likeComment is called directly on comment ID
router.post('/:id/like', likeComment);

export default router;
