import { Router } from 'express';
import { createReport, getReports, updateReportAction } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// 모든 신고 관련 API는 인증이 필요함
router.post('/', authenticate, createReport);
router.get('/', authenticate, getReports);
router.patch('/:id/action', authenticate, updateReportAction);

export default router;
