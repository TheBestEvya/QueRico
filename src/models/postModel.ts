import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './userModel';
import { IComment } from './commentModel';

export interface IPost extends Document {
  author: IUser['_id'];
  text: string;
  image?: string;
  likes: IUser['_id'][];
  commentsCount: number;  // שדה חדש לספירת תגובות
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
    trim: true
  },
  image: {
    type: String
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// אינדקסים לשיפור ביצועים
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });  // אינדקס לדף הראשי

// Virtual populate - מאפשר לנו לקבל את התגובות כשנרצה
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
});

export const Post = mongoose.model<IPost>('Post', postSchema);