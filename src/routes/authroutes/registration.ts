
import express, { Request, Response } from 'express';
import prisma from '../../prismaconfig';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// 1. Request types
type SignupBody = {
    name: string;
    email: string;
    password: string;
};

type LoginBody = {
    email: string;
    password: string;
};

// 2. Response types
type AuthResponse = {
    message: string;
    token?: string;
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
};

// 3. JWT payload type
type TokenPayload = {
    userId: number;
};

const authrouter = express.Router();

authrouter.post('/register', async (req: Request<SignupBody>, res: Response<AuthResponse>) => {
        try {
            const { name, email, password } = req.body;

            // Validate input types
            if (
                typeof name !== 'string' ||
                typeof email !== 'string' ||
                typeof password !== 'string'
            ) {
                return res.status(400).json({
                    message: 'Invalid input'
                });
            }

            // Check existing user
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(409).json({
                    message: 'User already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword
                }
            });

            return res.status(201).json({
                message: 'Registration successful',
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role
                },
                token: jwt.sign(
                    { userId: newUser.id },
                    process.env.JWT_SECRET || 'secret',
                    { expiresIn: '1d' }
                )
            });

        } catch (error: unknown) {
            console.error('Signup error:', error);

            return res.status(500).json({
                message: 'Internal server error'
            });
        }
    }
);

authrouter.post('/login', async (req: Request<LoginBody>,res: Response<AuthResponse>) => {
        try {
            const { email, password } = req.body;

            // Validate input types
            if (
                typeof email !== 'string' ||
                typeof password !== 'string'
            ) {
                return res.status(400).json({
                    message: 'Invalid input'
                });
            }

            // Find user
            const user = await prisma.user.findUnique({
                where: { email}
            });

            if (!user) {
                return res.status(401).json({
                    message: 'Invalid email or password'
                });
            }

            // Compare passwords
            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    message: 'Invalid email or password'
                });
            }

            // Validate JWT secret
            const jwtSecret = process.env.JWT_SECRET;

            if (!jwtSecret) {
                throw new Error('JWT_SECRET is not configured');
            }

            // Create typed JWT payload
            const payload: TokenPayload = {
                userId: user.id
            };

            // Generate token
            const token = jwt.sign(
                payload,
                jwtSecret,
                { expiresIn: '1d' }
            );

            return res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error: unknown) {
            console.error('Login error:', error);

            return res.status(500).json({
                message: 'Internal server error'
            });
        }
    }
);

export default authrouter;




