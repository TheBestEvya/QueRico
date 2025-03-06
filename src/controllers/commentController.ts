import { Request, Response } from 'express';
import { Comment, IComment } from '../models/commentModel';
import { Post } from '../models/postModel';

// Interfaces
interface CreateCommentRequest extends Request {
  body: {
    text: string;
    params: {
      postId: string;
    };
    userId: string;
  };
 
}

interface UpdateCommentRequest extends Request {
  body: {
    text: string;
    params: {
      commentId: string;
    };
    userId: string;
  };
 
}

interface GetCommentsRequest extends Request {
  params: {
    postId: string;
  };
  query: {
    page?: string;
    limit?: string;
  };
}


  // יצירת תגובה חדשה
  const createComment = async (req: CreateCommentRequest, res: Response):Promise<any> =>{
    try {
      const { text } = req.body;
      const { postId } = req.params;
      const userId = req.body.userId;

      // בדיקה שהפוסט קיים
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // יצירת התגובה
      const comment = await Comment.create({
        author: userId,
        post: postId,
        text
      });

      // החזרת התגובה עם פרטי המחבר
      await comment.populate('author', 'name profileImage');

      res.status(201).json(comment);
    } catch (error) {
    return  res.status(500).json({ message: 'Error creating comment', error });
    }
  }

  // קבלת כל התגובות לפוסט
  const getComments = async (req: GetCommentsRequest, res: Response) :Promise<any> => {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page || '1');
      const limit = parseInt(req.query.limit || '10');

      const comments = await Comment.find({ post: postId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name profileImage');

      const total = await Comment.countDocuments({ post: postId });

      res.status(200).json({
        comments,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComments: total
      });
    } catch (error) {
    return  res.status(500).json({ message: 'Error fetching comments', error });
    }
  }

  // עדכון תגובה
  const updateComment = async (req: UpdateCommentRequest, res: Response):Promise<any> => {
    try {
      const { commentId } = req.params;
      const { text } = req.body;
      const userId = req.body.userId;

      const comment = await Comment.findOne({
        _id: commentId,
        author: userId
      });

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found or unauthorized' });
      }

      comment.text = text;
      await comment.save();

      await comment.populate('author', 'name profileImage');

      res.status(200).json(comment);
    } catch (error) {
     return res.status(500).json({ message: 'Error updating comment', error });
    }
  }

  // מחיקת תגובה
  const deleteComment = async (req: Request<{ commentId: string }>, res: Response):Promise<any> => {
    try {
      const { commentId } = req.params;
      const userId = req.body.userId;

      const comment = await Comment.findOne({
        _id: commentId,
        author: userId
      });

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found or unauthorized' });
      }

      await comment.deleteOne();

    return  res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
    return res.status(500).json({ message: 'Error deleting comment', error });
    }
  }

  // קבלת כל התגובות של משתמש ספציפי
  // const getUserComments = async (req: Request<{ userId: string }>, res: Response):Promise<any>=> {
  //   try {
  //     const { userId } = req.params;
  //     const page = parseInt(req.query.page as string || '1');
  //     const limit = parseInt(req.query.limit as string || '10');

  //     const comments = await Comment.find({ author: userId })
  //       .sort({ createdAt: -1 })
  //       .skip((page - 1) * limit)
  //       .limit(limit)
  //       .populate('author', 'username profileImage')
  //       .populate('post', 'text');

  //     const total = await Comment.countDocuments({ author: userId });

  //     res.json({
  //       comments,
  //       currentPage: page,
  //       totalPages: Math.ceil(total / limit),
  //       totalComments: total
  //     });
  //   } catch (error) {
  //    return res.status(500).json({ message: 'Error fetching user comments', error });
  //   }
  // }
export default { createComment, getComments, updateComment, deleteComment /**, getUserComments,*/};