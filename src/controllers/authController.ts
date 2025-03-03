import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User, IUser } from '../models/userModel';

// Interfaces
interface RegisterRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface RefreshTokenRequest extends Request {
  body: {
    refreshToken: string;
  };
}

interface GoogleAuthRequest extends Request {
  body: {
    googleId: string;
    email: string;
    name: string;
    imageUrl: string;
  };
}

interface ChangePasswordRequest extends Request {
  body: {
    currentPassword: string;
    newPassword: string;
    userId: string; 
   };
  
}

interface ForgotPasswordRequest extends Request {
  body: {
    email: string;
  };
}
    const secret = process.env.JWT_SECRET ?? 'default';
    const expiresIn = process.env.JWT_EXPIRES_IN?? '1h';
    if (!secret) {
      throw new Error('Missing JWT_SECRET environment variable');
    }
    if (!expiresIn) {
      throw new Error('Missing JWT_EXPIRES_IN environment variable');
    }

  // רישום משתמש חדש
  const register=async  (req: RegisterRequest, res: Response):Promise<any>=> {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ 
        $or: [{ email }, { name }] 
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'email already exists' 
        });
      }

      const user = await User.create({
        name,
        email,
        password
      });

      const userId = user._id.toString();
      const accessToken = generateAccessToken(userId);
      const refreshToken = generateRefreshToken(userId);

      await User.findByIdAndUpdate(userId, { refreshToken });

      res.status(201).json({
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating user', error });
    }
  }

  // התחברות
  const login = async (req: LoginRequest, res: Response):Promise<any> => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const userId = user._id.toString();
      const accessToken = generateAccessToken(userId);
      const refreshToken = generateRefreshToken(userId);

      await User.findByIdAndUpdate(userId, { refreshToken });

      res.json({
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error });
    }
  }

  // התחברות עם גוגל
  const  googleAuth = async (req: GoogleAuthRequest, res: Response):Promise<any> =>{
    try {
      const { googleId, email, name, imageUrl } = req.body;

      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name: name,
          email,
          googleId,
          profileImage: imageUrl
        });
      } else {
        await User.findByIdAndUpdate(user._id, { googleId });
      }

      const userId = user._id.toString();
      const accessToken = generateAccessToken(userId);
      const refreshToken = generateRefreshToken(userId);

      await User.findByIdAndUpdate(userId, { refreshToken });

      res.json({
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      res.status(500).json({ message: 'Error with Google authentication', error });
    }
  }

  // חידוש טוקן
  const  refreshToken = async(req: RefreshTokenRequest, res: Response):Promise<any>=> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token required' });
      }

      const user = await User.findOne({ refreshToken });
      if (!user) {
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      try {
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
      } catch (error) {
        await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      const userId = user._id.toString();
      const newAccessToken = generateAccessToken(userId);
      const newRefreshToken = generateRefreshToken(userId);

      await User.findByIdAndUpdate(userId, { refreshToken: newRefreshToken });

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      res.status(500).json({ message: 'Error refreshing token', error });
    }
  }

  // התנתקות
  const  logout= async(req: RefreshTokenRequest, res: Response):Promise<any>=> {
    try {
      const { refreshToken } = req.body;
      
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      );

      res.json({ message: 'Successfully logged out' });
    } catch (error) {
      res.status(500).json({ message: 'Error logging out', error });
    }
  }

  // שינוי סיסמה
  const changePassword = async(req: ChangePasswordRequest, res: Response):Promise<any> =>{
    try {
      const { currentPassword, newPassword, userId } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      user.password = newPassword;
      await user.save();

      return res.status(200).json({ message: 'Password successfully updated' });
    } catch (error) {
      return res.status(500).json({ message: 'Error changing password', error });
    }
  }

  // שכחתי סיסמה
  // const  forgotPassword= async(req: ForgotPasswordRequest, res: Response):Promise<any>=> {
  //   try {
  //     const { email } = req.body;

  //     const user = await User.findOne({ email });
  //     if (!user) {
  //       return res.status(404).json({ message: 'User not found' });
  //     }

  //     // יצירת טוקן לאיפוס סיסמה
  //     const resetToken = jwt.sign(
  //       { userId: user._id },
  //       process.env.JWT_SECRET || 'your-secret-key',
  //       { expiresIn: '1h' }
  //     );

  //     // בפרויקט אמיתי כאן היינו שולחים מייל עם הטוקן
  //     res.json({ 
  //       message: 'Password reset instructions sent to email',
  //       resetToken // בפרויקט אמיתי לא נחזיר את הטוקן
  //     });
  //   } catch (error) {
  //     res.status(500).json({ message: 'Error with forgot password', error });
  //   }
  // }

  // Private methods
  const generateAccessToken = (userId: string): string =>{
    const secret = process.env.JWT_SECRET ?? 'default';
    const expiresIn = process.env.JWT_EXPIRES_IN?? '1h';
    


    return jwt.sign(
      { userId }, 
      secret , 
      { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
    );
  }
  const  generateRefreshToken = (userId: string): string =>{
    return jwt.sign(
      { userId }, 
      secret, 
      { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
    );
  }
export default {register,login,googleAuth,refreshToken,logout,changePassword,/**forgotPassword*/};