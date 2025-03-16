import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  userId? : string;
  accessToken?: string;
}

export const authenticateJwt = (req: AuthRequest, res: Response, next: NextFunction):any => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Auth middleware - No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    req.userId = decoded.userId;
   return next();
  } catch (error) {
    return res.status(403).json({ message: 'Auth middleware - Invalid or expired token' });
  }
};