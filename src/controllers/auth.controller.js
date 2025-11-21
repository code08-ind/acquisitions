import {
  createUser,
  getUserByEmail,
  comparePassword,
} from '../services/auth.service.js';
import { formatValidationError } from '../utils/format.js';
import { jwttoken } from '../utils/jwt.js';
import { signupSchema, signinSchema } from '../validations/auth.validation.js';
import { cookies } from '../utils/cookies.js';
import { logger } from '../config/logger.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { name, email, role, password } = validationResult.data;

    const user = await createUser({ name, email, password, role });

    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User registered successfully: ${email}`);

    res.status(201).json({
      message: 'User Registered',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const signin = async (req, res) => {
  try {
    const validationResult = signinSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn(
        `Signin validation failed: ${JSON.stringify(validationResult.error.errors)}`
      );
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    logger.info(`Signin attempt for email: ${email}`);

    const user = await getUserByEmail(email);
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      logger.error(`Signin failed - Invalid password for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User signed in successfully: ${email}`);

    res.status(200).json({
      message: 'User signed in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Signin error: ${error.message}`);
    res.status(401).json({ error: error.message });
  }
};

export const signout = async (req, res) => {
  try {
    const user = req.user;
    cookies.clear(res, 'token');

    logger.info(`User signed out successfully: ${user?.email || 'unknown'}`);

    res.status(200).json({ message: 'User signed out successfully' });
  } catch (error) {
    logger.error(`Signout error: ${error.message}`);
    res.status(500).json({ error: 'Signout failed' });
  }
};
