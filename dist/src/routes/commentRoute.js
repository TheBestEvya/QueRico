"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const commentController_1 = __importDefault(require("../controllers/commentController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *  name: Comment
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
 *     Comment:
 *       type: object
 *       required:
 *         - author
 *         - post
 *         - text
 *       properties:
 *         author:
 *           type: string
 *           description: ID of the user who wrote the comment
 *         post:
 *           type: string
 *           description: ID of the post the comment is associated with
 *         text:
 *           type: string
 *           description: The content of the comment
 *           maxLength: 1000
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the comment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the comment was last updated
 *       example:
 *         author: '60f5b5b5b5f4e4b4b4b4b4b4'  # Example User ID
 *         post: '60f5b5b5b5f4e4b4b4b4b4b5'    # Example Post ID
 *         text: 'This is a comment example.'
 *         createdAt: '2025-03-05T10:00:00Z'
 *         updatedAt: '2025-03-05T10:00:00Z'
 */
// Public routes
/**
 * @swagger
 * tags:
 *   - name: Comment
 *     description: User endpoints
 *
 * /comments/postComments/{postId}:
 *   get:
 *     summary: Get comments for a specific post
 *     description: Retrieve a list of comments for a given post, with pagination.
 *     tags:
 *       - Comment
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post for which comments are being retrieved
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of comments to fetch per page
 *     responses:
 *       200:
 *         description: A list of comments for the specified post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *                 currentPage:
 *                   type: integer
 *                   description: The current page number
 *                 totalPages:
 *                   type: integer
 *                   description: The total number of pages available for comments
 *                 totalComments:
 *                   type: integer
 *                   description: The total number of comments for the post
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Error fetching comments'
 *                 error:
 *                   type: string
 *                   example: 'Some error details'
 */
router.get('/postComments/:postId', commentController_1.default.getComments);
// router.get('/user/:userId', commentController.getUserComments);
// Protected routes
router.use(auth_1.authenticateJwt);
/**
 * @swagger
 * tags:
 *   - name: Comment
 *     description: User endpoints
 *
 * /comments/createComment/{postId}:
 *   post:
 *     summary: Create a comment on a specific post
 *     description: Allows an authenticated user to create a comment on a specific post.
 *     tags:
 *       - Comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to which the comment is being added
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The content of the comment
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Comment successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request, invalid input or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Post not found'
 *       401:
 *         description: Unauthorized, missing or invalid JWT token
 *       404:
 *         description: Post not found, the specified post ID doesn't exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Post not found'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Error creating comment'
 *                 error:
 *                   type: string
 *                   example: 'Some error details'
 */
router.post('/createComment/:postId', commentController_1.default.createComment);
/**
 * @swagger
 * tags:
 *   - name: Comment
 *     description: User endpoints
 *
 * /{commentId}:
 *   put:
 *     summary: Update a comment
 *     description: Allows an authenticated user to update their own comment.
 *     tags:
 *       - Comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to be updated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The updated content of the comment
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Comment successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request, invalid input or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Bad request'
 *       404:
 *         description: Comment not found or unauthorized to update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Comment not found or unauthorized'
 *       401:
 *         description: Unauthorized, missing or invalid JWT token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Error updating comment'
 *                 error:
 *                   type: string
 *                   example: 'Some error details'
 */
router.put('/:commentId', commentController_1.default.updateComment);
/**
 * @swagger
 * tags:
 *   - name: Comment
 *     description: User endpoints
 *
 * /{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     description: Allows an authenticated user to delete their own comment.
 *     tags:
 *       - Comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to be deleted
 *     responses:
 *       200:
 *         description: Comment successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Comment deleted successfully'
 *       404:
 *         description: Comment not found or unauthorized to delete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Comment not found or unauthorized'
 *       401:
 *         description: Unauthorized, missing or invalid JWT token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Error deleting comment'
 *                 error:
 *                   type: string
 *                   example: 'Some error details'
 */
router.delete('/:commentId', commentController_1.default.deleteComment);
exports.default = router;
//# sourceMappingURL=commentRoute.js.map