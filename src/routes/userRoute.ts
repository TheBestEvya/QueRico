import express from 'express';
import { authenticateJwt } from '../middleware/auth';
import userController from '../controllers/userController';

//{getProfile, getUserById, updateProfile, getUserPosts, deleteProfile}
const router = express.Router();

router.get('/allPosts', userController.getUserPosts)
router.get('/:userId', userController.getUserById)

router.use(authenticateJwt);
router.get('/', userController.getProfile)
router.post('/update', userController.updateProfile)
router.delete('/delete', userController.deleteProfile)