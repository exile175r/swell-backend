import { Router } from 'express';
import { getProfile, followUser } from '../controllers/user.controller';

const router = Router();

router.get('/:userId/profile', getProfile);
router.post('/follow', followUser);

export default router;
