import { Router } from 'express';
import { getLogs, createLog } from '../controllers/logController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/',  verifyToken, getLogs);
router.post('/', createLog);           // no auth — called by agents

export default router;
