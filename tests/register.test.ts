import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import request from "supertest";
import { jest, describe, it ,afterEach,expect } from "@jest/globals";

jest.unstable_mockModule('../src/prismaconfig.js', () => ({
    default: {
        user: {
            create: jest.fn(),
        },
    },
}));

const { default: prisma } = await import('../src/prismaconfig.js');
const { default: app } = await import('../src/app.js');

describe('POST /register', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new user and return a token', async () => {
        const mockUser = {
            id: 1,
            name: 'testuser',
            email: 'test@gmail.com',
            password: 'password123'
        };

        jest.mocked(prisma.user.create).mockResolvedValue({
          id: 999,
          name: mockUser.name,
          email: mockUser.email,
          password: await bcrypt.hash('password123', 10)
      } as any);

       const response = await request(app)
          .post("/auth/register")
          .send(mockUser);  
      // ASSERT: Verify the outcomes
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");  
    });
});    