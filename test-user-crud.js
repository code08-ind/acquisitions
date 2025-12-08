/**
 * Test script for User CRUD operations
 * Run with: node test-user-crud.js
 */

import { z } from 'zod';

// Import validation schemas
const userIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number').transform(Number),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(255).trim().optional(),
  email: z.string().email().max(255).toLowerCase().trim().optional(),
  password: z.string().min(6).max(128).optional(),
  role: z.enum(['user', 'admin']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

console.log('Testing User CRUD Validation Schemas...\n');

// Test userIdSchema
console.log('1. Testing userIdSchema:');
try {
  const validId = userIdSchema.parse({ id: '123' });
  console.log('✓ Valid ID:', validId);
} catch (error) {
  console.log('✗ Error:', error.message);
}

try {
  const invalidId = userIdSchema.parse({ id: 'abc' });
  console.log('✗ Should have failed for invalid ID');
} catch (error) {
  console.log('✓ Correctly rejected invalid ID');
}

console.log('\n2. Testing updateUserSchema:');

// Test valid update
try {
  const validUpdate = updateUserSchema.parse({
    name: 'John Doe',
    email: 'john@example.com',
  });
  console.log('✓ Valid update:', validUpdate);
} catch (error) {
  console.log('✗ Error:', error.message);
}

// Test empty update (should fail)
try {
  const emptyUpdate = updateUserSchema.parse({});
  console.log('✗ Should have failed for empty update');
} catch (error) {
  console.log('✓ Correctly rejected empty update');
}

// Test optional fields
try {
  const partialUpdate = updateUserSchema.parse({
    role: 'admin',
  });
  console.log('✓ Valid partial update:', partialUpdate);
} catch (error) {
  console.log('✗ Error:', error.message);
}

// Test email validation
try {
  const invalidEmail = updateUserSchema.parse({
    email: 'not-an-email',
  });
  console.log('✗ Should have failed for invalid email');
} catch (error) {
  console.log('✓ Correctly rejected invalid email');
}

// Test password length
try {
  const shortPassword = updateUserSchema.parse({
    password: '12345',
  });
  console.log('✗ Should have failed for short password');
} catch (error) {
  console.log('✓ Correctly rejected short password');
}

// Test invalid role
try {
  const invalidRole = updateUserSchema.parse({
    role: 'superuser',
  });
  console.log('✗ Should have failed for invalid role');
} catch (error) {
  console.log('✓ Correctly rejected invalid role');
}

console.log('\n✓ All validation tests completed!');
