import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    // Create token
    const token = jwt.sign(
      { userId: newUser.rows[0].id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Registration successful for user:', username); // Debug log

    res.json({ 
      token,
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;
    
    console.log('Login attempt received for:', emailOrUsername);

    // Input validation
    if (!emailOrUsername || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    // First try exact username match
    let userQuery = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [emailOrUsername]
    );

    // If no user found by username, try email
    if (userQuery.rows.length === 0) {
      userQuery = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [emailOrUsername]
      );
    }

    // Log query results (without sensitive data)
    console.log('User query results:', {
      found: userQuery.rows.length > 0,
      attemptedLogin: emailOrUsername
    });

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ 
        error: 'No account found with that username or email' 
      });
    }

    const user = userQuery.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    console.log('Password check:', {
      user: user.username,
      isValid: validPassword
    });

    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Invalid password' 
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', user.username);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Server error during login:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};