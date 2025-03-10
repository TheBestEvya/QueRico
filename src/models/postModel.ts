import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './userModel';
import { IComment, commentSchema } from './commentModel';

export interface IPost extends Document {
  author: IUser['id'];
  text: string;
  image?: string;
  likes: IUser['id'][];
  comments: IComment[]; 
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
  },
  image: {
    type: String
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema]
}, {
  timestamps: true
});

// אינדקסים לשיפור ביצועים
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });  // אינדקס לדף הראשי



export const Post = mongoose.model<IPost>('Post', postSchema);