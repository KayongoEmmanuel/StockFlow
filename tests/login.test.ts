
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { jest, describe, it, afterEach, expect, beforeEach } from '@jest/globals';

process.env.JWT_SECRET = 'secret';

jest.unstable_mockModule('../src/prismaconfig', () => ({
    default: {
        user: {
            findUnique: jest.fn()
        },
    },
}));

const { default: prisma } = await import('../src/prismaconfig');
const { default: app } = await import('../src/app');

describe('POST /login', () => {
    beforeEach(() => {
        const token: string = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should login a user and return a token', async () => {

        // ARRANGE: Hash the user's password
        const hashedPassword = await bcrypt.hash('password123', 10);

        const mockUser = {
            id: 1,
            name: 'testuser',
            email: 'test@gmail.com',
            password: hashedPassword
        };

        // Mock Prisma to return the user
        jest.mocked(prisma.user.findUnique).mockResolvedValue(
            mockUser as any
        );

        // ACT: Send login request with plain-text password
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'test@gmail.com',
                password: 'password123'
            });

        // ASSERT: Verify successful login
        expect(response.status).toBe(200);

        // Verify that a token was returned
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
    });
});
