import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();

describe('Authentication Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  beforeAll(async () => {
    // Clean up test data before running tests
    await prisma.user.deleteMany({
      where: {
        email: testUser.email
      }
    });
  });

  afterAll(async () => {
    // Clean up test data after tests
    await prisma.user.deleteMany({
      where: {
        email: testUser.email
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should not register a user with existing email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email already registered');
    });
  });

  describe('POST /auth/login', () => {
    it('should login an existing user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('Input Validation', () => {
    describe('Registration Validation', () => {
      it('should reject registration with invalid email', async () => {
        const response = await request(app)
          .post('/auth/register')
          .send({
            ...testUser,
            email: 'invalid-email'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should reject registration with short password', async () => {
        const response = await request(app)
          .post('/auth/register')
          .send({
            ...testUser,
            password: '12345'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should reject registration with short name', async () => {
        const response = await request(app)
          .post('/auth/register')
          .send({
            ...testUser,
            name: 'a'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Login Validation', () => {
      it('should reject login with invalid email format', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: 'invalid-email',
            password: testUser.password
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Malformed Requests', () => {
    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle partial request body', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: testUser.email })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('JWT Token Validation', () => {
    it('should return a valid JWT token on successful login', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      // Verify token structure (should be a string with 3 parts separated by dots)
      expect(response.body.token.split('.')).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock prisma.user.create to throw an error
      const originalCreate = prisma.user.create;
      prisma.user.create = vi.fn().mockImplementation(() => {
        throw new Error('Database connection error');
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');

      // Restore the original implementation
      prisma.user.create = originalCreate;
    });
  });
}); 