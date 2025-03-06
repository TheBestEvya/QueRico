import express from 'express';
import { authenticateJwt } from '../middleware/auth';
import userController from '../controllers/userController';
import {uploadImage} from '../middleware/uploads'


const router = express.Router();



/**
 * @swagger
 * tags:
 *  name: User
 * description: User endpoints
 * 
 */

/**
* @swagger
* components:
*   securitySchemes:
*     bearerAuth:
*       type: http
*       scheme: bearer
*       bearerFormat: JWT
*/

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: User full name
 *         email:
 *           type: string
 *           description: User email
 *         password:
 *           type: string
 *           description: User password
 *         accessToken:
 *           type: string
 *           description: User access token
 *         refreshToken:
 *           type: string
 *           description: User refresh token
 *       example:
 *         name: 'evyaaaaa'
 *         email: 'name@email.com'
 *         password: '123456'
 *         accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *         refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 */

/**
 * @swagger
 * /users/allPosts:
 *   get:
 *     summary: Get all posts by the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user's posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   author:
 *                     type: string
 *                     description: ID of the post author
 *                   text:
 *                     type: string
 *                     description: Content of the post
 *                   image:
 *                     type: string
 *                     description: Optional image URL
 *                   likes:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of user IDs who liked the post
 *                   comments:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: string
 *                           description: ID of the user who commented
 *                         text:
 *                           type: string
 *                           description: Comment text
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Comment creation date
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Post creation date
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Last updated date
 *             example:
 *               - author: "65f99a2b3c1234567890abcd"
 *                 text: "This is a sample post."
 *                 image: "https://example.com/image.jpg"
 *                 likes: ["65f99a2b3c1234567890efgh", "65f99a2b3c1234567890ijkl"]
 *                 comments:
 *                   - user: "65f99a2b3c1234567890mnop"
 *                     text: "Nice post!"
 *                     createdAt: "2023-03-05T10:15:30Z"
 *                 createdAt: "2023-03-05T10:15:30Z"
 *                 updatedAt: "2023-03-06T12:45:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/allPosts', userController.getUserPosts)

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user information by user ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID format
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:userId', userController.getUserById)

// Protected routes (require authentication)
router.use(authenticateJwt);
/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/', userController.getProfile)

/**
 * @swagger
 * /users/update:
 *   post:
 *     summary: Update the authenticated user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated user name
 *               email:
 *                 type: string
 *                 description: Updated user email
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional profile image file
 *     responses:
 *       200:
 *         description: Successfully updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Email already exists or invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/update',uploadImage.single('image'), userController.updateProfile)

/**
 * @swagger
 * /users/delete:
 *   delete:
 *     summary: Delete the authenticated user's profile and related posts
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile and related posts deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete('/delete', userController.deleteProfile)

export default router;