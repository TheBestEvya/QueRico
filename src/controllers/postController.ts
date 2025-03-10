import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Post, IPost } from '../models/postModel';
import { Comment, IComment } from '../models/commentModel';

// Interfaces
interface CreatePostRequest extends Request {
  userId?:string;
  body: {
    text: string;
    file?: Express.Multer.File;
    userId : string;
  };
 
}
interface UpdatePostRequest extends Request {
  params: {
    postId: string;
  };
  body: {
    text?: string;
    file?: Express.Multer.File;
    userId: string;
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
      const userId = req.userId;
      const { text } = req.body;
      const post = await Post.create({
        author: userId,
        text,
        image: req.file?.filename
      });
      // fetch the data of the author - only username and profileImage
      await post.populate('author', 'name profileImage');

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

      // const query = userId ? { author: userId } : {};

      const posts = await Post.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name profileImage')
        .populate({
          path: 'comments',
          options: { limit: 3 },
          populate: {
            path: 'author',
            select: 'name profileImage'
          }
        });

      const total = await Post.countDocuments();

      res.status(200).json({
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
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching post', error });
    }
  }

  // עדכון פוסט
  const updatePost=async (req: UpdatePostRequest, res: Response):Promise<any> => {
    try {
      const { postId } = req.params;
      const { text } = req.body;
      const userId = req.body.userId;

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
      ).populate('author', 'name profileImage');

      res.status(203).json(updatedPost);
    } catch (error) {
     return res.status(500).json({ message: 'Error updating post', error });
    }
  }

  // מחיקת פוסט
  const deletePost=async(req: Request<{ postId: string }>, res: Response):Promise<any> => {
    try {
      const { postId } = req.params;
      const userId = req.body.userId;

      const post = await Post.findOne({ _id: postId, author: userId });
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found or unauthorized' });
      }

      // מחיקת כל התגובות לפוסט
      await Comment.deleteMany({ post: postId });
      //TODO :: delete photo of the post
      await post.deleteOne();

     return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
     return res.status(500).json({ message: 'Error deleting post', error });
    }
  }

  // הוספת/הסרת לייק
  const toggleLike=async(req: Request<{ postId: string }>, res: Response):Promise<any> => {
    try {
      const { postId } = req.params;
      const {userId} = req.body.userId;

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

      res.status(200).json({
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
      //TODO :: check of the username and profileImage is for users
      const post = await Post.findById(postId)
        .populate('likes', 'name profileImage');

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      res.status(200).json(post.likes);
    } catch (error) {
    return  res.status(500).json({ message: 'Error fetching likes', error });
    }
  }


export default { createPost,getPostsByUser, getAllPosts, getPostById, updatePost, deletePost, toggleLike, getPostLikes };