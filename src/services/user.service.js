import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../models/user.model.js';
import { logger } from '../config/logger.js';
import { hashPassword } from './auth.service.js';

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users);
  } catch (error) {
    logger.error('Error fetching all users:', error);
    throw error;
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    logger.error(`Error fetching user by ID ${id}: ${error.message}`);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (existingUser.length === 0) {
      throw new Error('User not found');
    }

    // Prepare update data
    const updateData = { ...updates };

    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== existingUser[0].email) {
      const emailCheck = await db
        .select()
        .from(users)
        .where(eq(users.email, updateData.email));

      if (emailCheck.length > 0) {
        throw new Error('Email already in use');
      }
    }

    // Perform update
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`User ${id} updated successfully`);
    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user ${id}: ${error.message}`);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (existingUser.length === 0) {
      throw new Error('User not found');
    }

    // Delete user
    await db.delete(users).where(eq(users.id, id));

    logger.info(`User ${id} deleted successfully`);
    return { message: 'User deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting user ${id}: ${error.message}`);
    throw error;
  }
};
