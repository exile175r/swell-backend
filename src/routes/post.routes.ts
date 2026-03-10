import { Router } from 'express';
import { getPosts, createPost, updatePost, deletePost } from '../controllers/post.controller';
import { reactToPost, votePost } from '../controllers/interaction.controller';
import { createComment, getComments } from '../controllers/comment.controller';
import { authenticate, requireAdult } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getPosts); // 필터링을 위해 인증 필요 (본인의 팔로잉 목록 등)
router.post('/', authenticate, requireAdult, createPost); // 게시글 작성은 성인 전용
router.post('/:id/reaction', authenticate, reactToPost);
router.post('/:id/vote', authenticate, votePost);
router.get('/:id/comments', authenticate, getComments);
router.post('/:id/comments', authenticate, createComment);

router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

export default router;
