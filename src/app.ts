// src/app.ts
import productsRouter from './routes/applicationroutes/products';
import express from 'express';
import authrouter from './routes/authroutes/registration';
import authMiddleware from './middleware/authmiddleware';
import ordersRouter from './routes/applicationroutes/orders';

const app = express();

// Middleware
app.use(express.json());
app.use('/auth',authrouter);
app.use('/products', authMiddleware, productsRouter);
app.use('/orders', authMiddleware, ordersRouter);

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'StockFlow API is running' });
});

export default app;