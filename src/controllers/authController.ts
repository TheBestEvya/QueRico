import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/userModel';
import { OAuth2Client } from 'google-auth-library';
const secret = process.env.JWT_SECRET ?? 'default';
    const expiresIn = process.env.JWT_EXPIRES_IN?? '1h';
    if (!secret) {
      throw new Error('Missing JWT_SECRET environment variable');
    }
    if (!expiresIn) {
      throw new Error('Missing JWT_EXPIRES_IN environment variable');
    }
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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
interface ChangePasswordRequest extends Request {
  body: {
    currentPassword: string;
    newPassword: string;
    userId: string; 
   };
  
}
export const googleSignIn = async (req: Request, res: Response):Promise<any> => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' });
    }
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }
    const { email, picture, name } = payload;
    // Check if user exists in the database
    let user = await User.findOne({ email });

    if (!user) {
      // Auto-register new user
      user = await User.create({
        email,
        imgUrl: picture,
        name,
        password: 'google-signin', // Placeholder password
      });
    }
    // Generate JWT token
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    User.findByIdAndUpdate(user._id, { refreshToken });

    return res.status(200).json({ accessToken, user });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
  // רישום משתמש חדש
  const register=async  (req: RegisterRequest, res: Response):Promise<any>=> {
    try {
      const { name, email, password } = req.body;
      const existingUser = await User.findOne({ 
        $or: [{ email }] 
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
      console.log(error)
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

      res.status(200).json({
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

      res.status(200).json({
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

      res.status(200).json({ message: 'Successfully logged out' });
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
  // Private methods
  export const generateAccessToken = (userId: string): string =>{
    const secret = process.env.JWT_SECRET ?? 'default';
    const expiresIn = process.env.JWT_EXPIRES_IN?? '1h';
    
    return jwt.sign(
      { userId }, 
      secret , 
      { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
    );
  }
  export const  generateRefreshToken = (userId: string): string =>{
    return jwt.sign(
      { userId }, 
      secret, 
      { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
    );
  }
export default {register,login,refreshToken,logout,changePassword, googleSignIn};