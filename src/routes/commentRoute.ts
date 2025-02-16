import express from 'express';
import commentController from '../controllers/commentController';
import { authenticateJwt } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/post/:postId', commentController.getComments);
router.get('/post/:postId/count', commentController.getCommentCount);
router.get('/user/:userId', commentController.getUserComments);

// Protected routes
router.use(authenticateJwt);
router.post('/post/:postId', commentController.createComment);
router.put('/:commentId', commentController.updateComment);
router.delete('/:commentId', commentController.deleteComment);

export default router;