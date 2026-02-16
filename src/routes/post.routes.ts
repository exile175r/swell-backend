import { Router } from 'express';
import { getPosts, createPost } from '../controllers/post.controller';
import { reactToPost, votePost } from '../controllers/interaction.controller';
import { createComment } from '../controllers/comment.controller';
import { authenticate, requireAdult } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getPosts); // 필터링을 위해 인증 필요 (본인의 팔로잉 목록 등)
router.post('/', authenticate, requireAdult, createPost); // 게시글 작성은 성인 전용
router.post('/:id/reaction', authenticate, reactToPost);
router.post('/:id/vote', authenticate, votePost);
router.post('/:id/comments', authenticate, createComment);

export default router;
