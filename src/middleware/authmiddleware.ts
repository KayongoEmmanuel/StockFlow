import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Create a custom type for the request object to include userId
interface AuthenticatedRequest extends Request {
    userId?: number;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
        res.status(401).json({ message: 'Failed to authenticate user!' });
        return;
    }

    const tokenArray = authHeader.split(' ');
    const token = tokenArray[1];

    if (!token) {
        res.status(401).json({ message: 'Failed to authenticate user!' });
        return;
    }

    const jwtSecret: string = process.env.JWT_SECRET || 'default_secret_key';

    try {
        // This line throws an error if the token is expired or invalid
        const decoded = jwt.verify(token, jwtSecret) as { userId: string };

        if (!decoded || !decoded.userId) {
            res.status(401).json({ message: 'Failed to authenticate user!' });
            return;
        }

        req .userId = parseInt(decoded.userId, 10); 
        
        next(); 
        
    } catch (error: any) {
        
        console.error("JWT Verification Error:", error.message);
        
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Session expired. Please log in again.' });
            return;
        }
        
        res.status(401).json({ message: 'Invalid token.' });
        return;
    }
}

export default authMiddleware;