import { Router } from 'express';
import { getProfile, followUser, blockUser, getBlockedUsers, syncProfile, deleteHistory, withdraw, updatePushToken } from '../controllers/user.controller';

import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:userId/profile', getProfile);
router.post('/follow', authenticate, followUser);
router.post('/block', authenticate, blockUser);
router.get('/blocks', authenticate, getBlockedUsers);

router.post('/sync', authenticate, syncProfile);
router.delete('/:userId/history', authenticate, deleteHistory);
router.delete('/:userId', authenticate, withdraw);
router.post('/push-token', authenticate, updatePushToken);

export default router;
