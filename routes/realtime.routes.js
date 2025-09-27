import { Router } from 'express';
import {
  streamEvents,
  pollUpdates,
  notifyUpdate
} from '../controllers/realtime.controllers.js';

const router = Router();

// Server-Sent Events endpoint for real-time updates
router.route('/events').get(streamEvents);

// Polling endpoint for updates
router.route('/poll').get(pollUpdates);

// Notify endpoint for triggering updates
router.route('/notify').post(notifyUpdate);

export default router;