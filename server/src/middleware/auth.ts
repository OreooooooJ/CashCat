import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Set a default test user for development
  req.user = {
    id: "test-user-id",
    email: "test@example.com"
  };
  
  // Continue to the next middleware/route handler
  next();
  
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