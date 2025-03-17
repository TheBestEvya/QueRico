import express from 'express';
import postController from '../controllers/postController';
import { authenticateJwt } from '../middleware/auth';
import { uploadImage } from '../middleware/uploads';

const router = express.Router();
/**
 * @swagger
 * tags:
 *  name: Post
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
 *     Post:
 *       type: object
 *       required:
 *         - author
 *         - text
 *         - likes
 *         - comments
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier for the post
 *         author:
 *           type: string
 *           description: The ID of the user who created the post
 *         text:
 *           type: string
 *           description: The content of the post
 *         image:
 *           type: string
 *           description: URL of the post's image (optional)
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *             description: The IDs of the users who liked the post
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *           description: The list of comments on the post
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the post was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the post was last updated
 *       example:
 *         _id: '605c72ef1532072f8d5b0b1f'
 *         author: '605c72ef1532072f8d5b0b1e'
 *         text: 'This is a post content.'
 *         image: 'https://example.com/image.jpg'
 *         likes: ['605c72ef1532072f8d5b0b2c', '605c72ef1532072f8d5b0b3d']
 *         comments:
 *           - _id: '605c72ef1532072f8d5b0b4e'
 *             author: '605c72ef1532072f8d5b0b1e'
 *             text: 'This is a comment.'
 *             createdAt: '2025-03-06T12:00:00Z'
 *         createdAt: '2025-03-06T12:00:00Z'
 *         updatedAt: '2025-03-06T12:00:00Z'
 */
// Public routes
/**
 * @swagger
 * /posts/:
 *   get:
 *     tags:
 *       - Post
 *     summary: Get all posts with pagination
 *     description: Retrieves a list of posts, optionally filtered by userId and paginated by page and limit parameters.
 *     parameters:
 *       - name: page
 *         in: query
 *         description: The page number for pagination (default is 1)
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: The number of posts per page (default is 10)
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: userId
 *         in: query
 *         description: The user ID to filter posts by author
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of posts along with pagination information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       author:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                           profileImage:
 *                             type: string
 *                       comments:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             content:
 *                               type: string
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                             author:
 *                               type: object
 *                               properties:
 *                                 username:
 *                                   type: string
 *                                 profileImage:
 *                                   type: string
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalPosts:
 *                   type: integer
 *       500:
 *         description: Error fetching posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.get('/', postController.getAllPosts);
/**
 * @swagger
 * /posts/{postId}:
 *   get:
 *     tags:
 *       - Post
 *     summary: Get a post by ID
 *     description: Retrieves a specific post by its unique identifier (`postId`), along with its author and comments.
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The unique identifier of the post
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested post object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post not found"
 *       500:
 *         description: Error fetching post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.get('/user/:userId', postController.getPostsByUser);
router.get('/:postId', postController.getPostById);
/**
 * @swagger
 * /posts/{postId}/likes:
 *   get:
 *     tags:
 *       - Post
 *     summary: Get the likes of a post
 *     description: Retrieves a list of users who liked a specific post, identified by `postId`.
 *     parameters:
 *       - name: postId
 *         in: path
 *         description: The unique identifier of the post
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of users who liked the post
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   profileImage:
 *                     type: string
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post not found"
 *       500:
 *         description: Error fetching likes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.get('/:postId/likes', postController.getPostLikes);

// Protected routes
router.use(authenticateJwt);
// Routes that might include image upload
/**
 * @swagger
 * /posts/:
 *   post:
 *     tags:
 *       - Post
 *     summary: Create a new post
 *     description: Creates a new post with the provided text and an optional image. The post is associated with the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The content of the post
 *               image:
 *                 type: string
 *                 description: The image file for the post (optional, must be uploaded via form-data)
 *             required:
 *               - text
 *     responses:
 *       201:
 *         description: The created post object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request, missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bad request"
 *       401:
 *         description: Unauthorized, invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Error creating post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.post('/', uploadImage.single('image'), postController.createPost);
/**
 * @swagger
 * /posts/{postId}:
 *   put:
 *     tags:
 *       - Post
 *     summary: Update an existing post
 *     description: Updates the content (and optionally the image) of an existing post. The post must belong to the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         description: The ID of the post to be updated
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The updated content of the post
 *               image:
 *                 type: string
 *                 description: The updated image file for the post (optional, must be uploaded via form-data)
 *     responses:
 *       200:
 *         description: The updated post object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request, missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bad request"
 *       401:
 *         description: Unauthorized, invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Post not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post not found or unauthorized"
 *       500:
 *         description: Error updating post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.put('/:postId', uploadImage.single('image'), postController.updatePost);
// Other protected routes
/**
 * @swagger
 * /posts/{postId}:
 *   delete:
 *     tags:
 *       - Post
 *     summary: Delete a post
 *     description: Deletes a post and all its associated comments. The post must belong to the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         description: The ID of the post to be deleted
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post deleted successfully"
 *       401:
 *         description: Unauthorized, invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Post not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post not found or unauthorized"
 *       500:
 *         description: Error deleting post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */

router.delete('/:postId', postController.deletePost);
/**
 * @swagger
 * /posts/{postId}/like:
 *   post:
 *     tags:
 *       - Post
 *     summary: Toggle like on a post
 *     description: Adds or removes a like from a post. If the user has already liked the post, the like is removed. If not, the like is added.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         description: The ID of the post to like or unlike
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The user object containing the user ID who is liking the post
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user who is liking or unliking the post
 *     responses:
 *       200:
 *         description: Successfully toggled like on the post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 likes:
 *                   type: integer
 *                   description: The number of likes on the post
 *                   example: 25
 *                 isLiked:
 *                   type: boolean
 *                   description: Indicates whether the post is liked by the user
 *                   example: true
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post not found"
 *       401:
 *         description: Unauthorized, invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Error toggling like
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.post('/:postId/like', postController.toggleLike);

export default router;