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
Object.defineProperty(exports, "__esModule", { value: true });
const userModel_1 = require("../models/userModel");
const postModel_1 = require("../models/postModel");
const dotenv_1 = __importDefault(require("dotenv"));
const commentModel_1 = require("../models/commentModel");
dotenv_1.default.config();
const uploadPath = process.env.UPLOAD_PATH;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId; // מגיע ממידלוור האוטנטיקציה
        const user = yield userModel_1.User.findById(userId).select('-password -refreshToken');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error });
    }
});
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const user = yield userModel_1.User.findById(userId).select('-password -refreshToken');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
});
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email } = req.body;
        const userId = req.userId;
        // עדכון פרטי המשתמש
        const updatedUser = yield userModel_1.User.findByIdAndUpdate(userId, {
            $set: Object.assign({ name,
                email }, (req.file && { profileImage: uploadPath + req.file.filename }))
        }, { new: true }).select('-password -refreshToken');
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating profile', error });
    }
});
const getUserPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const posts = yield postModel_1.Post.find({ author: userId })
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .populate('author', 'name profileImage')
            .populate({
            path: 'comments',
            options: { limit: 3 },
            populate: {
                path: 'author',
                select: 'name profileImage'
            }
        });
        const total = yield postModel_1.Post.countDocuments({ author: userId });
        res.status(200).json({
            posts,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page)
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching user posts', error });
    }
});
const deleteProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId; // Get the authenticated user's ID
        // First, check if the user exists
        const user = yield userModel_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // מחיקת כל התגובות שנכתבו על ידי המשתמש
        yield commentModel_1.Comment.deleteMany({ author: userId });
        // מציאת כל הפוסטים של המשתמש לפני מחיקתם (כדי שנוכל למחוק את התגובות עליהם)
        const userPosts = yield postModel_1.Post.find({ author: userId });
        const userPostIds = userPosts.map(post => post._id);
        // מחיקת כל התגובות על הפוסטים של המשתמש
        yield commentModel_1.Comment.deleteMany({ post: { $in: userPostIds } });
        // מחיקת כל הפוסטים של המשתמש
        yield postModel_1.Post.deleteMany({ author: userId });
        // מחיקת המשתמש עצמו
        const deletedUser = yield userModel_1.User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'Error deleting user profile' });
        }
        res.status(200).json({ message: 'User profile and related content deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting profile', error });
    }
});
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield userModel_1.User.find({}).select('-password -refreshToken -createdAt');
        res.status(200).json({ users: users });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
});
exports.default = { getAllUsers, getProfile, getUserById, updateProfile, getUserPosts, deleteProfile };
//# sourceMappingURL=userController.js.map