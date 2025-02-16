import { Request, Response } from 'express';
import { User } from '../models/userModel';
import { Post } from '../models/postModel';

class UserController {
  // קבלת פרטי המשתמש המחובר
  async getProfile(req: Request, res: Response) {
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
  }

  // קבלת פרטי משתמש ספציפי
  async getUserById(req: Request, res: Response) {
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
  }

  // עדכון פרטי משתמש
  async updateProfile(req: Request, res: Response) {
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
  }

  // קבלת הפוסטים של משתמש ספציפי
  async getUserPosts(req: Request, res: Response) {
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
  }
}

export default new UserController();
