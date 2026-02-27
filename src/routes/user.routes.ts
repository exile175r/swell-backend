import { Router } from 'express';
import { getProfile, followUser, blockUser, getBlockedUsers } from '../controllers/user.controller';

import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:userId/profile', getProfile);
router.post('/follow', authenticate, followUser);
router.post('/block', authenticate, blockUser);
router.get('/blocks', authenticate, getBlockedUsers);

export default router;
