import { Router } from 'express';
import { createPost, getFeed, likePost } from '../controllers/postController';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/', auth, createPost);
router.get('/feed', auth, getFeed);
router.post('/:id/like', auth, likePost);

export default router;
