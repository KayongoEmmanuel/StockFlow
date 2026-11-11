
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest, describe, it, afterEach, expect, beforeEach } from '@jest/globals';

process.env.JWT_SECRET = 'secret';

jest.unstable_mockModule('../src/prismaconfig', () => ({
    default: {
        user: {
            findUnique: jest.fn()
        },
        product: {
            findMany: jest.fn(),
            count: jest.fn()
        },
        $transaction: jest.fn(),
    },
}));

const { default: prisma } = await import('../src/prismaconfig');
const { default: app } = await import('../src/app');

describe('GET /products', () => {

    let token: string;

    beforeEach(() => {
        token = jwt.sign(
            { userId: 1 },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should retrieve paginated products belonging to the authenticated user', async () => {

        // ARRANGE: Mock products belonging to user 1
        const mockProducts = [
            {
                id: 'product-1',
                name: 'Laptop',
                description: 'Dell laptop',
                sku: 'LAP001',
                price: 1500,
                quantity: 5,
                userId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'product-2',
                name: 'Keyboard',
                description: 'Mechanical keyboard',
                sku: 'KEY001',
                price: 100,
                quantity: 10,
                userId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        jest.mocked(prisma.product.findMany).mockResolvedValue(
            mockProducts as any
        );

        jest.mocked(prisma.$transaction).mockResolvedValue([
            mockProducts,
            5
        ] as any);

        // ACT: Request page 2 with 2 products per page
        const response = await request(app)
            .get('/products?page=2&limit=2')
            .set('Authorization', `Bearer ${token}`);

        // ASSERT: Verify successful response
        expect(response.status).toBe(200);

        expect(response.body.data).toHaveLength(2);

        expect(response.body.pagination).toEqual({
        currentPage: 2,
        limit: 2,
        hasNextPage: true,
        hasPreviousPage: true,
        totalPages: 3,
        totalProducts: 5
        });

        // Verify that Prisma filtered products by authenticated user
        expect(prisma.product.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    userId: 1
                },
                skip: 2,
                take: 2
            })
        );

        // Verify total product count
        expect(prisma.product.count).toHaveBeenCalledWith({
            where: {
                userId: 1
            }
        });
    });

    it('should reject requests without an authentication token', async () => {

        // ACT
        const response = await request(app)
            .get('/products?page=1&limit=10');

        // ASSERT
        expect(response.status).toBe(401);

        // Prisma should not be queried
        expect(prisma.product.findMany).not.toHaveBeenCalled();
    });
});
