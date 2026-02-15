import { Router } from 'express';
import { getPosts, createPost } from '../controllers/post.controller';
import { reactToPost, votePost } from '../controllers/interaction.controller';
import { createComment } from '../controllers/comment.controller';

const router = Router();

router.get('/', getPosts);
router.post('/', createPost);
router.post('/:id/reaction', reactToPost);
router.post('/:id/vote', votePost);
router.post('/:id/comments', createComment);

export default router;
