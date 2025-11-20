import { eq } from 'drizzle-orm';
import { logger } from '../config/logger';
import bcrypt from 'bcrypt';
import { db } from '../config/database';
import { users } from '../models/user.model.js';

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error(`Error hashing the password: ${error.message}`);
    throw new Error('Error hashing password');
  }
};

export const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error(`Error comparing passwords: ${error.message}`);
    throw new Error('Error comparing passwords');
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) throw new Error('User Already Exists');

    const password_hash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: password_hash, role })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      });

    logger.info(`User ${newUser.email} created successfully`);
    return newUser;
  } catch (error) {
    logger.error(`Error creating the user: ${error.message}`);
    throw new Error(error.message);
  }
};

export const getUserByEmail = async email => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) throw new Error('User not found');
    return user;
  } catch (error) {
    logger.error(`Error fetching user: ${error.message}`);
    throw new Error(error.message);
  }
};
