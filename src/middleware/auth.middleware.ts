import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, process.env.SESSION_SECRET || 'fallback_secret', async (err: any, decoded: any) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    
    // Find user to attach to request
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(403).json({ message: 'User not found' });
    
    req.user = user;
    next();
  });
};
