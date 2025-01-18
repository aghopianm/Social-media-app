import { Request, Response } from 'express';
import pool from '../config/database';

export const createPost = async (req: Request, res: Response) => {
  try {
    console.log('Creating post with data:', req.body);
    console.log('User from token:', req.user);

    const { content } = req.body;
    const { username } = req.user;

    const result = await pool.query(
      'INSERT INTO posts (content, author_username) VALUES ($1, $2) RETURNING *',
      [content, username]
    );

    console.log('Post created:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Error creating post', details: error.message });
  }
};

export const getFeed = async (req: Request, res: Response) => {
  try {
    console.log('Fetching feed for user:', req.user);

    const result = await pool.query(`
      SELECT 
        p.*,
        u.full_name,
        COALESCE(l.like_count, 0) as like_count,
        EXISTS(
          SELECT 1 FROM likes 
          WHERE post_id = p.id AND username = $1
        ) as is_liked
      FROM posts p
      JOIN users u ON p.author_username = u.username
      LEFT JOIN (
        SELECT post_id, COUNT(*) as like_count 
        FROM likes 
        GROUP BY post_id
      ) l ON l.post_id = p.id
      ORDER BY p.created_at DESC
    `, [req.user.username]);

    console.log('Feed fetched, post count:', result.rows.length);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Error fetching feed', details: error.message });
  }
};

export const likePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username } = req.user;

    // Check if already liked
    const existingLike = await pool.query(
      'SELECT * FROM likes WHERE post_id = $1 AND username = $2',
      [id, username]
    );

    if (existingLike.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM likes WHERE post_id = $1 AND username = $2',
        [id, username]
      );
    } else {
      // Like
      await pool.query(
        'INSERT INTO likes (post_id, username) VALUES ($1, $2)',
        [id, username]
      );
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error handling like:', error);
    res.status(500).json({ error: 'Error liking post', details: error.message });
  }
};
