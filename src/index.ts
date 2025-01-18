import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import postRoutes from './routes/postRoutes';

// Log environment variables (remove in production)
console.log('Database connection details:', {
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  // Don't log the actual password
  hasPassword: !!process.env.DB_PASSWORD
});

const app = express();

app.use(cors());
app.use(express.json());

// Add a test route
app.get('/', (req, res) => {
  res.json({ message: 'Facebook Clone API is running!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
