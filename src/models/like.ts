import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './userModel';
import { IPost } from './postModel';

export interface ILike extends Document {
  user: IUser['_id'];
  post: IPost['_id'];
  createdAt: Date;
}

const likeSchema = new Schema<ILike>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
}, {
  timestamps: true
});

// אינדקס ייחודי למניעת לייקים כפולים
likeSchema.index({ user: 1, post: 1 }, { unique: true });

export const Like = mongoose.model<ILike>('Like', likeSchema);