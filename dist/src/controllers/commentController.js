"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const commentModel_1 = require("../models/commentModel");
const postModel_1 = require("../models/postModel");
// יצירת תגובה חדשה
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text } = req.body;
        const { postId } = req.params;
        const userId = req.userId;
        // Check if the post exists
        const post = yield postModel_1.Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        // Create the comment
        const comment = yield commentModel_1.Comment.create({
            author: userId,
            post: postId,
            text
        });
        // Populate the author field of the comment
        yield comment.populate('author', 'name profileImage');
        // Update the post document to add the new comment
        post.comments.push(comment); // Add the new comment's ID to the post's comments array
        yield post.save(); // Save the updated post
        // Return the newly created comment along with the author's information
        res.status(201).json(comment);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating comment', error });
    }
});
// קבלת כל התגובות לפוסט
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const comments = yield commentModel_1.Comment.find({ post: postId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'name profileImage');
        const total = yield commentModel_1.Comment.countDocuments({ post: postId });
        res.status(200).json({
            comments,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalComments: total
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching comments', error });
    }
});
// עדכון תגובה
const updateComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { commentId } = req.params;
        const { text } = req.body;
        const userId = req.userId;
        const comment = yield commentModel_1.Comment.findOne({
            _id: commentId,
            author: userId
        });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found or unauthorized' });
        }
        comment.text = text;
        yield comment.save();
        yield comment.populate('author', 'name profileImage');
        res.status(200).json(comment);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error updating comment', error });
    }
});
// מחיקת תגובה
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { commentId } = req.params;
        const userId = req.userId;
        const comment = yield commentModel_1.Comment.findOne({
            _id: commentId
        });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        yield postModel_1.Post.findByIdAndUpdate(comment.post, {
            $pull: { comments: { _id: commentId } }
        });
        yield comment.deleteOne();
        return res.status(200).json({ message: 'Comment deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error deleting comment', error });
    }
});
exports.default = { createComment, getComments, updateComment, deleteComment };
//# sourceMappingURL=commentController.js.map