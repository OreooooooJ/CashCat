import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Mock the Prisma client
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    $disconnect: vi.fn()
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient)
  };
});

// Mock JWT
vi.mock('jsonwebtoken', async () => {
  return {
    default: {
      verify: vi.fn()
    },
    verify: vi.fn()
  }
});

// Mock bcrypt
vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password')
}));

describe('User Profile API', () => {
  const testUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const validToken = 'valid.jwt.token';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock JWT verify to return a valid user ID
    (jwt.verify as any).mockReturnValue({ userId: testUser.id });
    
    // Mock Prisma findUnique to return the test user
    (prisma.user.findUnique as any).mockResolvedValue(testUser);
  });

  describe('GET /api/users/profile', () => {
    it('should return 401 if no token is provided', async () => {
      const response = await request(app)
        .get('/api/users/profile');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 401 if token is invalid', async () => {
      // Mock JWT verify to throw an error
      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid token');
    });

    it('should return 404 if user is not found', async () => {
      // Mock Prisma findUnique to return null
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should return user profile if token is valid', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should handle server errors gracefully', async () => {
      // Mock Prisma findUnique to throw an error
      (prisma.user.findUnique as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Server error');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should return 401 if no token is provided', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ name: 'Updated Name' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ email: 'invalid-email' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('email');
    });

    it('should check if email is already in use', async () => {
      // Mock Prisma findUnique to return a different user with the same email
      (prisma.user.findUnique as any).mockImplementationOnce(() => testUser)
        .mockImplementationOnce(() => ({ id: 2, email: 'new@example.com' }));

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ email: 'new@example.com' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email already in use');
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ password: '123' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('password');
    });

    it('should update user profile successfully', async () => {
      // Mock Prisma update to return the updated user
      (prisma.user.update as any).mockResolvedValue({
        ...testUser,
        name: 'Updated Name',
        email: 'updated@example.com'
      });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Name');
      expect(response.body).toHaveProperty('email', 'updated@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should hash password when updating with new password', async () => {
      // Mock Prisma update to return the updated user
      (prisma.user.update as any).mockResolvedValue({
        ...testUser,
        password: 'hashed_password'
      });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          password: 'newpassword123'
        });
      
      expect(response.status).toBe(200);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: { password: 'hashed_password' }
      });
    });

    it('should handle server errors during update', async () => {
      // Mock Prisma update to throw an error
      (prisma.user.update as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Updated Name' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Server error');
    });
  });
}); 