import { Request, Response } from 'express';
import { User } from '../models/userModel';
import { Post } from '../models/postModel';

const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // מגיע ממידלוור האוטנטיקציה
    const user = await User.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};

const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
};

const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;
    
    // בדיקה האם השם משתמש או האימייל כבר קיימים
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: userId } },
        { $or: [{ username }, { email }] }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Username or email already exists'
      });
    }

    // עדכון פרטי המשתמש
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          username,
          email,
          ...(req.file && { profileImage: req.file.filename })
        }
      },
      { new: true }
    ).select('-password -refreshToken');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
};

const getUserPosts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('author', 'username profileImage')
      .populate({
        path: 'comments',
        options: { limit: 3 },
        populate: {
          path: 'author',
          select: 'username profileImage'
        }
      });

    const total = await Post.countDocuments({ author: userId });

    res.json({
      posts,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user posts', error });
  }
};

const deleteProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Get the authenticated user's ID

    // First, check if the user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all posts related to the user
    await Post.deleteMany({ author: userId });

    // Delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'Error deleting user profile' });
    }

    res.json({ message: 'User profile and related posts deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting profile', error });
  }
};

export default {getProfile, getUserById, updateProfile, getUserPosts, deleteProfile};