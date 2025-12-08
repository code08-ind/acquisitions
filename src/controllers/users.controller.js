import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '../services/user.service.js';
import { logger } from '../config/logger.js';
import {
  userIdSchema,
  updateUserSchema,
} from '../validations/users.validation.js';
import { formatValidationError } from '../utils/format.js';

export const fetchAllUsers = async (req, res) => {
  try {
    logger.info('Fetching all users');
    const users = await getAllUsers();
    res.status(200).json({
      message: 'Successfully retrieved users',
      users,
      count: users.length,
    });
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserById = async (req, res) => {
  try {
    // Validate user ID
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      logger.warn(
        `Get user by ID validation failed: ${JSON.stringify(validationResult.error.errors)}`
      );
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Fetching user with ID: ${id}`);
    const user = await getUserByIdService(id);

    res.status(200).json({
      message: 'Successfully retrieved user',
      user,
    });
  } catch (error) {
    logger.error(`Error fetching user: ${error.message}`);

    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    // Validate user ID
    const idValidation = userIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      logger.warn(
        `Update user ID validation failed: ${JSON.stringify(idValidation.error.errors)}`
      );
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidation.error),
      });
    }

    const { id } = idValidation.data;

    // Validate update data
    const bodyValidation = updateUserSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      logger.warn(
        `Update user body validation failed: ${JSON.stringify(bodyValidation.error.errors)}`
      );
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const updates = bodyValidation.data;

    // Check if authenticated user exists (from auth middleware)
    if (!req.user) {
      logger.warn('Unauthorized update attempt - no authenticated user');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Authorization checks
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = req.user.id === id;

    // Users can only update their own profile
    if (!isOwnProfile && !isAdmin) {
      logger.warn(
        `User ${req.user.id} attempted to update user ${id} without permission`
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile',
      });
    }

    // Only admins can change roles
    if (updates.role && !isAdmin) {
      logger.warn(
        `Non-admin user ${req.user.id} attempted to change role for user ${id}`
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can change user roles',
      });
    }

    // If non-admin is updating own profile, remove role from updates
    if (!isAdmin && updates.role) {
      delete updates.role;
    }

    logger.info(
      `User ${req.user.id} updating user ${id} with fields: ${Object.keys(updates).join(', ')}`
    );

    const updatedUser = await updateUserService(id, updates);

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);

    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Email already in use') {
      return res.status(409).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    // Validate user ID
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      logger.warn(
        `Delete user ID validation failed: ${JSON.stringify(validationResult.error.errors)}`
      );
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    // Check if authenticated user exists (from auth middleware)
    if (!req.user) {
      logger.warn('Unauthorized delete attempt - no authenticated user');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Authorization checks
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = req.user.id === id;

    // Users can only delete their own profile, admins can delete any
    if (!isOwnProfile && !isAdmin) {
      logger.warn(
        `User ${req.user.id} attempted to delete user ${id} without permission`
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own profile',
      });
    }

    logger.info(`User ${req.user.id} deleting user ${id}`);

    const result = await deleteUserService(id);

    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);

    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to delete user' });
  }
};
