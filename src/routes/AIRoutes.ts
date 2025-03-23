import express from 'express';
import { authenticateJwt } from '../middleware/auth';
import AIController from '../controllers/AIController';

const router = express.Router();

router.use(authenticateJwt)


router.post('/chatMsg' , AIController.getChatResponse)

export default router;