import { Request, Response } from 'express';
import { User } from '../models/userModel';
import { Post } from '../models/postModel';
import env from 'dotenv';
import { Comment } from '../models/commentModel';
env.config();
const uploadPath = process.env.UPLOAD_PATH;
interface userRequest extends Request {
  userId?: string;
}
const getProfile = async (req: userRequest, res: Response):Promise<any> => {
  try {
    const userId = req.userId; // מגיע ממידלוור האוטנטיקציה
    const user = await User.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};

const getUserById = async (req: Request, res: Response):Promise<any> => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
};

const updateProfile = async (req: userRequest, res: Response):Promise<any> => {
  try {
    const { name, email   } = req.body;
    const userId = req.userId;
    // עדכון פרטי המשתמש
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
          email,
          ...(req.file && { profileImage: uploadPath+req.file.filename })
        }
      },
      { new: true }
    ).select('-password -refreshToken');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
};

const getUserPosts = async (req: Request, res: Response):Promise<any> => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({ author: userId })
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

    const total = await Post.countDocuments({ author: userId });

    res.status(200).json({
      posts,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user posts', error });
  }
};
const deleteProfile = async (req: userRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId; // Get the authenticated user's ID

    // First, check if the user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // מחיקת כל התגובות שנכתבו על ידי המשתמש
    await Comment.deleteMany({ author: userId });

    // מציאת כל הפוסטים של המשתמש לפני מחיקתם (כדי שנוכל למחוק את התגובות עליהם)
    const userPosts = await Post.find({ author: userId });
    const userPostIds = userPosts.map(post => post._id);

    // מחיקת כל התגובות על הפוסטים של המשתמש
    await Comment.deleteMany({ post: { $in: userPostIds } });

    // מחיקת כל הפוסטים של המשתמש
    await Post.deleteMany({ author: userId });

    // מחיקת המשתמש עצמו
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'Error deleting user profile' });
    }

    res.status(200).json({ message: 'User profile and related content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting profile', error });
  }
};
const getAllUsers = async (req: Request, res: Response):Promise<any> => {
try{
const users = await User.find({}).select('-password -refreshToken -createdAt');
res.status(200).json({users : users});
}catch(error){  
  res.status(500).json({ message: 'Error fetching users', error });
}

}
export default {getAllUsers , getProfile, getUserById, updateProfile, getUserPosts, deleteProfile};