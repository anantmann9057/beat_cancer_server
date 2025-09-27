import { Router } from 'express';
import {
  generateChatResponse,
  getChatHistory,
  deleteChatConversation,
  updateChatContext,
  getAvailableModels,
  moderateContent,
  getSystemPrompts,
  updateSystemPrompt
} from '../controllers/chatgpt.controllers.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';

const router = Router();

// All routes are now public (no authentication required)
router.route('/models').get(getAvailableModels);
router.route('/moderate').post(moderateContent);
router.route('/prompts').get(getSystemPrompts);
router.route('/prompts').put(updateSystemPrompt);

// Chat functionality (no authentication required)
router.route('/chat').post(generateChatResponse);
router.route('/history').get(getChatHistory);
router.route('/history/:sessionId').get(getChatHistory);
router.route('/conversation/:sessionId').delete(deleteChatConversation);
router.route('/context/:sessionId').put(updateChatContext);

export default router;