import express from 'express';
import {
  fetchAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/users.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const userRouter = express.Router();

// Get all users (public or requires auth based on your needs)
userRouter.get('/', fetchAllUsers);

// Get user by ID (public)
userRouter.get('/:id', getUserById);

// Update user (requires authentication)
userRouter.put('/:id', requireAuth, updateUser);

// Delete user (requires admin role)
userRouter.delete('/:id', requireAuth, requireRole('admin'), deleteUser);

export default userRouter;
