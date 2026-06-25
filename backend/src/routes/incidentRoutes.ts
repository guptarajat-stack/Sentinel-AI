import { Router } from 'express';
import {
  getIncidents,
  getIncidentStats,
  getIncident,
  createIncident,
  updateIncident,
} from '../controllers/incidentController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Stats endpoint must come before /:id to avoid being matched as an id
router.get('/stats', verifyToken, getIncidentStats);

router.get('/',     verifyToken, getIncidents);
router.get('/:id',  verifyToken, getIncident);
router.post('/',    createIncident);        // no auth — called by agents
router.patch('/:id', verifyToken, updateIncident);

export default router;
