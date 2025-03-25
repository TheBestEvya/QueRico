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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const postModel_1 = require("../models/postModel");
const commentModel_1 = require("../models/commentModel");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uploadPath = (_a = process.env.UPLOAD_PATH) !== null && _a !== void 0 ? _a : "http://localhost:5000/uploads/";
// יצירת פוסט חדש
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.userId;
        const { text } = req.body;
        const post = yield postModel_1.Post.create({
            author: userId,
            text
        });
        if (req.file !== undefined) {
            post.image = uploadPath + ((_a = req.file) === null || _a === void 0 ? void 0 : _a.filename);
            yield post.save();
        }
        // fetch the data of the author - only username and profileImage
        yield post.populate('author', 'name profileImage');
        return res.status(201).json(post);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error creating post', error });
    }
});
// קבלת כל הפוסטים עם paging
const getAllPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const posts = yield postModel_1.Post.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'id name profileImage')
            .populate({
            path: 'comments',
            options: { limit: 3 },
            populate: {
                path: 'author',
                select: 'name profileImage'
            }
        });
        const total = yield postModel_1.Post.countDocuments();
        res.status(200).json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPosts: total
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching posts', error });
    }
});
// קבלת פוסט ספציפי
const getPostById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const post = yield postModel_1.Post.findById(req.params.postId)
            .populate('author', 'name profileImage')
            .populate({
            path: 'comments',
            populate: {
                path: 'author',
                select: 'name profileImage'
            }
        });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        return res.status(200).json(post);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching post', error });
    }
});
// עדכון פוסט
const updatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const { text } = req.body;
        const userId = req.userId;
        const post = yield postModel_1.Post.findOne({ _id: postId, author: userId });
        if (!post) {
            return res.status(404).json({ message: 'Post not found or unauthorized' });
        }
        const updateData = { text };
        if (!post.image) {
            if (req.file) {
                updateData.image = uploadPath + req.file.filename;
            }
            else {
                updateData.image = null;
            }
        }
        const updatedPost = yield postModel_1.Post.findByIdAndUpdate(postId, { $set: updateData }, { new: true }).populate('author', 'name profileImage');
        res.status(203).json(updatedPost);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error updating post', error });
    }
});
// מחיקת פוסט
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const userId = req.userId;
        const post = yield postModel_1.Post.findOne({ _id: postId, author: userId });
        if (!post) {
            return res.status(404).json({ message: 'Post not found or unauthorized' });
        }
        // מחיקת כל התגובות לפוסט
        yield commentModel_1.Comment.deleteMany({ post: postId });
        yield post.deleteOne();
        return res.status(200).json({ message: 'Post deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error deleting post', error });
    }
});
// הוספת/הסרת לייק
const toggleLike = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const userId = req.userId;
        const userIdObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const post = yield postModel_1.Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const userLikedIndex = post.likes.indexOf(userIdObjectId);
        if (userLikedIndex === -1) {
            // הוספת לייק
            if (userId) {
                post.likes.push(userIdObjectId);
            }
        }
        else {
            // הסרת לייק
            post.likes.splice(userLikedIndex, 1);
        }
        yield post.save();
        res.status(200).json({
            likes: post.likes.length,
            isLiked: userLikedIndex === -1
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error toggling like', error });
    }
});
const getPostsByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 posts
    try {
        // Get paginated posts and total count
        const posts = yield postModel_1.Post.find({ author: userId })
            .skip((page - 1) * limit) // Skip previous pages
            .limit(limit) // Limit results per page
            .sort({ createdAt: -1 })
            .populate('author', 'name profileImage')
            .populate({
            path: 'comments',
            options: { limit: 3 },
            populate: {
                path: 'author',
                select: 'name profileImage'
            }
        });
        const totalPosts = yield postModel_1.Post.countDocuments({ author: userId });
        // if (posts.length === 0) {
        //   res.status(404).json({ message: 'No posts found for this user' });
        //   return;
        // }
        // Send paginated response
        res.status(200).json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts,
        });
    }
    catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts' });
    }
});
// קבלת הלייקים של פוסט
const getPostLikes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const post = yield postModel_1.Post.findById(postId)
            .populate('likes', 'name profileImage');
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json(post.likes);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching likes', error });
    }
});
exports.default = { createPost, getPostsByUser, getAllPosts, getPostById, updatePost, deletePost, toggleLike, getPostLikes };
//# sourceMappingURL=postController.js.map