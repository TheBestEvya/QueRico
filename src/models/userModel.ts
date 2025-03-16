import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser{
    id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    profileImage: string;
    googleId?: string;
    refreshToken?: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
  }

const userSchema = new Schema<IUser>({
    name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
        validator: function (value: string) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Invalid email format',
    },
},
  password: {
    type: String,
    required: function(this: IUser) {
      return !this.googleId;
    },
    minlength: 6
  },
  profileImage: {
    type: String,
    default: 'default.jpg'
  },
  googleId: {
    type: String,
    sparse: true
  },
  refreshToken: {
    type: String
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);