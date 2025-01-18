import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, fullName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, hashedPassword, fullName]
    );

    const token = jwt.sign({ username }, process.env.JWT_SECRET || 'secret');
    res.json({ token, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET || 'secret');
    res.json({ token, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
};
