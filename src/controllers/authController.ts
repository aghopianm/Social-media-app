import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Registration attempt with data:', {
      ...req.body,
      password: '[HIDDEN]'
    });

    const { username, email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, passwordHash, fullName]
    );

    // Generate token
    const token = jwt.sign({ username }, process.env.JWT_SECRET || 'your-secret-key');

    console.log('Registration successful for:', username);
    res.json({ token });
  } catch (error: any) {
    console.error('Registration error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Error registering user',
      details: error.message 
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log('Login attempt for username:', req.body.username);

    const { username, password } = req.body;

    // Check if user exists
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    console.log('User found:', user.rows.length > 0);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ username }, process.env.JWT_SECRET || 'your-secret-key');

    console.log('Login successful for:', username);
    res.json({ token });
  } catch (error: any) {
    console.error('Login error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Error logging in',
      details: error.message 
    });
  }
};