import { Router } from 'express';
import { transcribeAudio } from '../controllers/ai.controller';

const router = Router();

router.post('/', transcribeAudio);

export default router;
