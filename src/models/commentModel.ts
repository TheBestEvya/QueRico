import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './userModel';
import { IPost } from './postModel';

export interface IComment extends Document {
  author: IUser['_id'];
  post: IPost['_id'];
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export const commentSchema = new Schema<IComment>({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000 // הגבלת אורך התגובה
  }
}, {
  timestamps: true
});

// אינדקסים לשיפור ביצועים
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);