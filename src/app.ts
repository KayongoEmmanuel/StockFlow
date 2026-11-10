// src/app.ts
import productsRouter from './routes/applicationroutes/products';
import express from 'express';
import authrouter from './routes/authroutes/registration';
import authMiddleware from './middleware/authmiddleware';

const app = express();

// Middleware
app.use(express.json());
app.use('/auth',authrouter);
app.use('/products', authMiddleware, productsRouter);

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'StockFlow API is running' });
});

export default app;