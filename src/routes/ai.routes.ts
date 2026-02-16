import { Router } from 'express';
import { transcribeAudio } from '../controllers/ai.controller';

import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, transcribeAudio);

export default router;
