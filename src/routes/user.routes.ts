import { Router } from 'express';
import { getProfile, followUser } from '../controllers/user.controller';

import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:userId/profile', getProfile);
router.post('/follow', authenticate, followUser);

export default router;
