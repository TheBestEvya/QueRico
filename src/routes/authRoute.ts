import express, { Request, Response } from 'express';
import authController from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';
import passport from 'passport';
import {uploadImage} from '../middleware/uploads'


const router = express.Router();
// Public routes
/**
 * @swagger
 * tags:
 *  name: Auth
 * description: User authentication
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

// Start Google OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Handle Google callback and return JWT + profile picture
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = req.user as { user: any; accessToken: string ; refreshToken: string };

    res.json({
        accessToken,
        refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture, // Send profile picture in response
      },
    });
  }
);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registers a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: The new user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Email already exists"
 *       500:
 *         description: Error creating a user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error while creating a user"
 */
router.post('/register',uploadImage.single('image'), authController.register);

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
 *         email:
 *           type: string
 *           description: User email
 *         password:
 *           type: string
 *           description: User password
 *       example:
 *         email: 'name@email.com'
 *         password: '123456'
 * paths:
 *   /auth/login:
 *     post:
 *       summary: Logs in a user
 *       tags: 
 *         - Auth
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       responses:
 *         200:
 *           description: Successful login
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   accessToken:
 *                     type: string
 *                     example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   refreshToken:
 *                     type: string
 *                     example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   _id:
 *                     type: string
 *                     example: 60d0fe4f5311236168a109ca
 *         400:
 *           description: Invalid credentials or request
 */


router.post('/login', authController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh tokens
 *     description: Refresh access and refresh tokens using the provided refresh token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid refresh token
 */
router.post('/refresh-token', authController.refreshToken);



// Protected routes (require authentication)
router.use(authenticateJwt);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user and invalidate the refresh token
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []  # Require JWT authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Successful logout
 *       400:
 *         description: Invalid refresh token
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Server error
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: User change password
 *     description: Changes user password
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []  # Require JWT authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: passssssss
 *               newPassword:    # Fixed indentation here
 *                 type: string
 *                 example: newPassworddddd
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid request - Incorrect password or missing fields
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
router.post('/change-password', authController.changePassword);


export default router;