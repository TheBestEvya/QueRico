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
  };
  userId? : string;
 
}

interface UpdateCommentRequest extends Request {
  body: {
    text: string;
    params: {
      commentId: string;
    };
  };
  userId?: string;
 
}
interface deleteRequest extends Request {
params: {
  commentId: string;
}
userId?: string;

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
  const createComment = async (req: CreateCommentRequest, res: Response): Promise<any> => {
    try {
      const { text } = req.body;
      const { postId } = req.params;
      const userId = req.userId;
  
      // Check if the post exists
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      // Create the comment
      const comment = await Comment.create({
        author: userId,
        post: postId,
        text
      });
  
      // Populate the author field of the comment
      await comment.populate('author', 'name profileImage');
  
      // Update the post document to add the new comment
      post.comments.push(comment);  // Add the new comment's ID to the post's comments array
      await post.save();  // Save the updated post
  
      // Return the newly created comment along with the author's information
      res.status(201).json(comment);
    } catch (error) {
      return res.status(500).json({ message: 'Error creating comment', error });
    }
  };
  

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
      const userId = req.userId;

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
  const deleteComment = async (req: deleteRequest, res: Response):Promise<any> => {
    try {
      const { commentId } = req.params;
      const userId = req.userId;
      
      const comment = await Comment.findOne({
        _id: commentId
      });
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      await Post.findByIdAndUpdate(comment.post, {
        $pull: { comments: { _id: commentId } }
      });
      await comment.deleteOne();

    return  res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
    return res.status(500).json({ message: 'Error deleting comment', error });
    }
  }

export default { createComment, getComments, updateComment, deleteComment};