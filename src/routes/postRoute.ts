import express from 'express';
import postController from '../controllers/postController';
import { authenticateJwt } from '../middleware/auth';
import { uploadImage } from '../middleware/uploads';

const router = express.Router();

// Public routes
router.get('/', postController.getAllPosts);
router.get('/:postId', postController.getPostById);
router.get('/:postId/likes', postController.getPostLikes);

// Protected routes
router.use(authenticateJwt);

// Routes that might include image upload
router.post('/', uploadImage.single('image'), postController.createPost);
router.put('/:postId', uploadImage.single('image'), postController.updatePost);

// Other protected routes
router.delete('/:postId', postController.deletePost);
router.post('/:postId/like', postController.toggleLike);

export default router;