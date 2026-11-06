// src/app.ts

import express from 'express';
import router1 from './routes/authroutes/registration.js';

const app = express();

// Middleware
app.use(express.json());
app.use('/auth',router1);

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'StockFlow API is running' });
});

export default app;