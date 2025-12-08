import { z } from 'zod';

// Schema for validating user ID parameter
export const userIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number').transform(Number),
});

// Schema for validating user update requests
export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).trim().optional(),
  email: z.string().email().max(255).toLowerCase().trim().optional(),
  password: z.string().min(6).max(128).optional(),
  role: z.enum(['user', 'admin']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});
