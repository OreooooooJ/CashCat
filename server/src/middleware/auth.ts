import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 AUTH MIDDLEWARE: Starting authentication process');
  console.log('🔍 AUTH MIDDLEWARE: Request path:', req.path);
  
  try {
    // Get the authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('🔍 AUTH MIDDLEWARE: No token provided');
      
      // For development/testing, provide a fallback test user
      if (process.env.NODE_ENV === 'development') {
        const hardcodedUserId = '2e875360-dc75-43ea-a2d4-1a61b6a3bed2';
        console.log('🔍 AUTH MIDDLEWARE: Development mode - using hardcoded user ID:', hardcodedUserId);
        
        req.user = {
          id: hardcodedUserId,
          email: 'test@example.com'
        };
        return next();
      }
      
      return res.status(401).json({ error: 'Authentication token required' });
    }

    // Verify the token
    const user = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as {
      id: string;
      email: string;
    };
    
    req.user = user;
    console.log('🔍 AUTH MIDDLEWARE: Authenticated user:', user);
    next();
  } catch (error) {
    console.error('🔍 AUTH MIDDLEWARE: Error verifying token:', error);
    
    // For development/testing only
    if (process.env.NODE_ENV === 'development' && 
        (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError)) {
      console.log('🔍 AUTH MIDDLEWARE: Development mode - providing fallback user despite token error');
      
      req.user = {
        id: "2e875360-dc75-43ea-a2d4-1a61b6a3bed2",
        email: "test@example.com"
      };
      return next();
    }
    
    return res.status(403).json({ error: 'Invalid token' });
  }
}; 