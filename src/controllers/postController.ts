import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Post, IPost } from '../models/postModel';
import { Comment, IComment } from '../models/commentModel';

// Interfaces
interface CreatePostRequest extends Request {
  body: {
    text: string;
    file?: Express.Multer.File;
    user: {
      id: string;
    };
  };
 
}
interface UpdatePostRequest extends Request {
  params: {
    postId: string;
  };
  body: {
    text?: string;
    file?: Express.Multer.File;
    user: {
      id: string;
    };
  };
 
}
interface GetPostsRequest extends Request {
  query: {
    page?: string;
    limit?: string;
    userId?: string;
  };
}


  // יצירת פוסט חדש
   const createPost= async (req: CreatePostRequest, res: Response):Promise<any> => {
    try {
      const { text } = req.body;
      const userId = req.body.user.id;

      const post = await Post.create({
        author: userId,
        text,
        image: req.file?.filename
      });
      // fetch the data of the author - only username and profileImage
      await post.populate('author', 'username profileImage');

     return res.status(201).json(post);
    } catch (error) {
     return res.status(500).json({ message: 'Error creating post', error });
    }
  }

  // קבלת כל הפוסטים עם paging
  const getAllPosts = async(req: GetPostsRequest, res: Response)=> {
    try {
      const page = parseInt(req.query.page || '1');
      const limit = parseInt(req.query.limit || '10');
      const userId = req.query.userId;

      const query = userId ? { author: userId } : {};

      const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'username profileImage')
        .populate({
          path: 'comments',
          options: { limit: 3 },
          populate: {
            path: 'author',
            select: 'username profileImage'
          }
        });

      const total = await Post.countDocuments(query);

      res.json({
        posts,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching posts', error });
    }
  }

  // קבלת פוסט ספציפי
 const getPostById = async (req: Request<{ postId: string }>, res: Response) :Promise<any>=> {
    try {
      const post = await Post.findById(req.params.postId)
        .populate('author', 'username profileImage')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'username profileImage'
          }
        });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

     return res.json(post);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching post', error });
    }
  }

  // עדכון פוסט
  const updatePost=async (req: UpdatePostRequest, res: Response):Promise<any> => {
    try {
      const { postId } = req.params;
      const { text } = req.body;
      const userId = req.body.user.id;

      const post = await Post.findOne({ _id: postId, author: userId });
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found or unauthorized' });
      }

      const updateData: any = { text };
      if (req.file) {
        updateData.image = req.file.filename;
      }

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $set: updateData },
        { new: true }
      ).populate('author', 'username profileImage');

      res.json(updatedPost);
    } catch (error) {
     return res.status(500).json({ message: 'Error updating post', error });
    }
  }

  // מחיקת פוסט
  const deletePost=async(req: Request<{ postId: string }>, res: Response):Promise<any> => {
    try {
      const { postId } = req.params;
      const userId = req.body.user.id;

      const post = await Post.findOne({ _id: postId, author: userId });
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found or unauthorized' });
      }

      // מחיקת כל התגובות לפוסט
      await Comment.deleteMany({ post: postId });
      
      await post.deleteOne();

     return res.json({ message: 'Post deleted successfully' });
    } catch (error) {
     return res.status(500).json({ message: 'Error deleting post', error });
    }
  }

  // הוספת/הסרת לייק
  const toggleLike=async(req: Request<{ postId: string }>, res: Response):Promise<any> => {
    try {
      const { postId } = req.params;
      const {userId} = req.body.user.id;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const userLikedIndex = post.likes.indexOf(userId);
      
      if (userLikedIndex === -1) {
        // הוספת לייק
        post.likes.push(userId);
      } else {
        // הסרת לייק
        post.likes.splice(userLikedIndex, 1);
      }

      await post.save();

      res.json({
        likes: post.likes.length,
        isLiked: userLikedIndex === -1
      });
    } catch (error) {
     return res.status(500).json({ message: 'Error toggling like', error });
    }
  }

  const getPostsByUser = async (req: Request<{ userId: string }>, res: Response): Promise<void> => {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;  // Default to page 1
    const limit = parseInt(req.query.limit as string) || 10; // Default to 10 posts
  
    try {  
      // Get paginated posts and total count
      const posts = await Post.find({ author: userId })
        .skip((page - 1) * limit) // Skip previous pages
        .limit(limit) // Limit results per page
        .sort({ createdAt: -1 }); // Optional: Sort by newest
  
      const totalPosts = await Post.countDocuments({ author: userId });
  
      if (posts.length === 0) {
        res.status(404).json({ message: 'No posts found for this user' });
        return;
      }
  
      // Send paginated response
      res.status(200).json({
        posts,
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Error fetching posts' });
    }
  };
  // קבלת הלייקים של פוסט
  const getPostLikes=async(req: Request<{ postId: string }>, res: Response):Promise<any> => {
    try {
      const { postId } = req.params;

      const post = await Post.findById(postId)
        .populate('likes', 'username profileImage');

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      res.json(post.likes);
    } catch (error) {
    return  res.status(500).json({ message: 'Error fetching likes', error });
    }
  }


export default { createPost,getPostsByUser, getAllPosts, getPostById, updatePost, deletePost, toggleLike, getPostLikes };