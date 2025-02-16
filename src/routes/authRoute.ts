import express from 'express';
import authController from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);

// Protected routes (require authentication)
router.use(authenticateJwt);
router.post('/logout', authController.logout);
router.post('/change-password', authController.changePassword);


export default router;