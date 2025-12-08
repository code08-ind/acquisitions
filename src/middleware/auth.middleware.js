import { jwttoken } from '../utils/jwt.js';
import { cookies } from '../utils/cookies.js';
import { logger } from '../config/logger.js';

/**
 * Middleware to verify JWT token and attach user to request
 * This makes authentication optional - use requireAuth for mandatory auth
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = cookies.get(req, 'token');

    if (!token) {
      // No token, but don't block the request
      req.user = null;
      return next();
    }

    // Verify and decode token
    const decoded = jwttoken.verify(token);
    req.user = decoded;

    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);
    req.user = null;
    next();
  }
};

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = cookies.get(req, 'token');

    if (!token) {
      logger.warn('Authentication required but no token provided');
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please sign in to access this resource',
      });
    }

    // Verify and decode token
    const decoded = jwttoken.verify(token);
    req.user = decoded;

    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);
    return res.status(401).json({
      error: 'Invalid or expired token',
      message: 'Please sign in again',
    });
  }
};

/**
 * Middleware to require a specific role
 * Must be used after requireAuth
 * @param {string} requiredRole - The role required to access the resource
 * @returns {Function} Express middleware function
 */
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Role check failed - no authenticated user');
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (req.user.role !== requiredRole) {
      logger.warn(
        `User ${req.user.id} with role '${req.user.role}' attempted to access resource requiring role: ${requiredRole}`
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: `${requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} access required`,
      });
    }

    next();
  };
};

/**
 * Convenience middleware for admin-only access
 * Equivalent to requireRole('admin')
 */
export const requireAdmin = requireRole('admin');
