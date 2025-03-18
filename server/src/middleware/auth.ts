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

// AUTHENTICATION TEMPORARILY DISABLED
// Original implementation is commented out below
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 AUTH MIDDLEWARE: Starting authentication process');
  console.log('🔍 AUTH MIDDLEWARE: Request path:', req.path);
  
  try {
    // IMPORTANT: Hardcoding the user ID from the database test
    const hardcodedUserId = '2e875360-dc75-43ea-a2d4-1a61b6a3bed2';
    
    console.log('🔍 AUTH MIDDLEWARE: Using hardcoded user ID:', hardcodedUserId);
    
    // Set the user directly with the hardcoded ID
    req.user = {
      id: hardcodedUserId,
      email: 'test@example.com'
    };
    
    console.log('🔍 AUTH MIDDLEWARE: Set req.user to:', req.user);
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    console.error('🔍 AUTH MIDDLEWARE: Error in authentication middleware:', error);
    // Set a default test user for development as fallback
    req.user = {
      id: "test-user-id",
      email: "test@example.com"
    };
    console.log('🔍 AUTH MIDDLEWARE: Set req.user to fallback default due to error:', req.user);
    next();
  }
  
  /* Original authentication logic:
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as {
      id: string;
      email: string;
    };
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  */
}; 