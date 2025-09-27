import { Router } from 'express';
import {
  getWebSocketClients,
  sendUserNotification,
  sendBroadcastNotification,
  getWebSocketStats
} from '../controllers/websocket.controllers.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';

const router = Router();

// All routes are now public (no authentication required)

// Get connected clients
router.route('/clients').get(getWebSocketClients);

// Get WebSocket statistics  
router.route('/stats').get(getWebSocketStats);

// Send notification to specific user
router.route('/notify/user').post(sendUserNotification);

// Send notification to all users
router.route('/notify/broadcast').post(sendBroadcastNotification);

export default router;