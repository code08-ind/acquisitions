# User CRUD API Documentation

This document describes the User CRUD (Create, Read, Update, Delete) operations implemented in the Acquisitions API.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Authorization Rules](#authorization-rules)
- [Examples](#examples)

## Overview

The User CRUD API provides endpoints to manage user accounts with proper authentication and authorization controls.

### Features

- ✅ **Get all users** - Retrieve a list of all users
- ✅ **Get user by ID** - Retrieve a specific user's details
- ✅ **Update user** - Modify user information (name, email, password, role)
- ✅ **Delete user** - Remove a user account

### Security

- Password hashing with bcrypt (10 salt rounds)
- JWT-based authentication
- Role-based authorization (user/admin)
- Input validation with Zod schemas
- Comprehensive logging

## Authentication

Protected endpoints require a valid JWT token in the cookie (`token`).

### Getting a Token

Sign in to receive a JWT token:

```bash
POST /api/auth/sign-in
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

The token is automatically set as an HTTP-only cookie.

## API Endpoints

### 1. Get All Users

Retrieve a list of all users (without passwords).

**Endpoint:** `GET /api/users`

**Authentication:** Not required (configurable)

**Response:**

```json
{
  "message": "Successfully retrieved users",
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 2. Get User by ID

Retrieve a specific user's information.

**Endpoint:** `GET /api/users/:id`

**Authentication:** Not required

**Parameters:**
- `id` (URL parameter): User ID (must be a valid number)

**Example Request:**

```bash
GET /api/users/1
```

**Success Response (200):**

```json
{
  "message": "Successfully retrieved user",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid user ID format
- **404 Not Found:** User does not exist
- **500 Internal Server Error:** Server error

---

### 3. Update User

Update user information. Users can update their own profile; admins can update any profile and change roles.

**Endpoint:** `PUT /api/users/:id`

**Authentication:** Required (JWT token in cookie)

**Parameters:**
- `id` (URL parameter): User ID to update

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "newpassword123",
  "role": "admin"
}
```

All fields are optional, but at least one field must be provided.

**Example Request:**

```bash
PUT /api/users/1
Content-Type: application/json
Cookie: token=<jwt-token>

{
  "name": "Jane Smith",
  "email": "jane.smith@example.com"
}
```

**Success Response (200):**

```json
{
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-02T00:00:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request:** Validation error (invalid ID, email format, etc.)
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** 
  - Trying to update another user's profile (non-admin)
  - Trying to change role without admin privileges
- **404 Not Found:** User does not exist
- **409 Conflict:** Email already in use by another user
- **500 Internal Server Error:** Server error

---

### 4. Delete User

Delete a user account. Users can delete their own account; admins can delete any account.

**Endpoint:** `DELETE /api/users/:id`

**Authentication:** Required (JWT token in cookie)

**Parameters:**
- `id` (URL parameter): User ID to delete

**Example Request:**

```bash
DELETE /api/users/1
Cookie: token=<jwt-token>
```

**Success Response (200):**

```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**

- **400 Bad Request:** Invalid user ID format
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Trying to delete another user's account (non-admin)
- **404 Not Found:** User does not exist
- **500 Internal Server Error:** Server error

## Authorization Rules

### User Roles

- **user**: Standard user with limited permissions
- **admin**: Administrator with elevated permissions

### Permission Matrix

| Action | User (Own Profile) | User (Others) | Admin (Any) |
|--------|-------------------|---------------|-------------|
| Get All Users | ✅ | ✅ | ✅ |
| Get User by ID | ✅ | ✅ | ✅ |
| Update Name/Email/Password | ✅ | ❌ | ✅ |
| Update Role | ❌ | ❌ | ✅ |
| Delete Account | ✅ | ❌ | ✅ |

### Authorization Logic

**Update User:**
- Users can update their **own** name, email, and password
- Users **cannot** change their own or anyone's role
- Admins can update **any** user's information including role

**Delete User:**
- Users can delete **their own** account
- Admins can delete **any** account

## Examples

### Example 1: User Updates Own Profile

```bash
# User with ID 5 updates their own name
PUT /api/users/5
Cookie: token=<jwt-token-for-user-5>

{
  "name": "New Name"
}

# Response: 200 OK
```

### Example 2: User Tries to Update Another User (Fails)

```bash
# User with ID 5 tries to update user 3
PUT /api/users/3
Cookie: token=<jwt-token-for-user-5>

{
  "name": "Hacked Name"
}

# Response: 403 Forbidden
{
  "error": "Forbidden",
  "message": "You can only update your own profile"
}
```

### Example 3: Admin Updates Any User

```bash
# Admin updates user 3's role
PUT /api/users/3
Cookie: token=<jwt-token-for-admin>

{
  "role": "admin"
}

# Response: 200 OK
```

### Example 4: User Tries to Change Role (Fails)

```bash
# User tries to make themselves admin
PUT /api/users/5
Cookie: token=<jwt-token-for-user-5>

{
  "role": "admin"
}

# Response: 403 Forbidden
{
  "error": "Forbidden",
  "message": "Only administrators can change user roles"
}
```

### Example 5: Update with Password

```bash
# User updates their password
PUT /api/users/5
Cookie: token=<jwt-token-for-user-5>

{
  "password": "newSecurePassword123"
}

# Response: 200 OK
# Note: Password is automatically hashed with bcrypt
```

### Example 6: Delete Own Account

```bash
# User deletes their own account
DELETE /api/users/5
Cookie: token=<jwt-token-for-user-5>

# Response: 200 OK
{
  "message": "User deleted successfully"
}
```

## Validation Rules

### User ID Schema

- Must be a valid numeric string
- Automatically converted to number

### Update User Schema

- **name**: 2-255 characters, trimmed (optional)
- **email**: Valid email format, max 255 characters, lowercase, trimmed (optional)
- **password**: 6-128 characters (optional, automatically hashed)
- **role**: Must be either "user" or "admin" (optional)
- At least one field must be provided

## Error Handling

All errors are logged with appropriate context including:
- User ID attempting the action
- Target user ID
- Error type and message
- Timestamp

### Common Error Formats

**Validation Error:**

```json
{
  "error": "Validation failed",
  "details": "ID must be a valid number"
}
```

**Authentication Error:**

```json
{
  "error": "Authentication required",
  "message": "Please sign in to access this resource"
}
```

**Authorization Error:**

```json
{
  "error": "Forbidden",
  "message": "You can only update your own profile"
}
```

## Testing

A test script is provided to validate the validation schemas:

```bash
node test-user-crud.js
```

This tests:
- User ID validation
- Update schema validation
- Email validation
- Password length requirements
- Role validation
- Empty update rejection

## Implementation Details

### Files Created/Modified

1. **src/validations/users.validation.js** - Zod validation schemas
2. **src/services/user.service.js** - Service layer with CRUD operations
3. **src/controllers/users.controller.js** - Controller functions
4. **src/middleware/auth.middleware.js** - Authentication middleware
5. **src/routes/users.routes.js** - Route definitions

### Key Features

- **Password Security**: Passwords are hashed using bcrypt before storage
- **Email Uniqueness**: Checks for duplicate emails during updates
- **Transaction Safety**: User existence checked before updates/deletes
- **Comprehensive Logging**: All operations logged with Winston
- **Input Validation**: Zod schemas ensure data integrity
- **Authorization**: Role-based access control enforced at controller level

## Next Steps

Potential enhancements:

- [ ] Add pagination to GET /api/users
- [ ] Add filtering and sorting options
- [ ] Implement user search functionality
- [ ] Add email verification for email changes
- [ ] Add password confirmation for sensitive operations
- [ ] Implement soft delete instead of hard delete
- [ ] Add user activity logging
- [ ] Implement rate limiting per user
