# Auth Module

This module manages authentication for LumiEdu.

## Current Features
- Register
- Login
- Forgot password
- Reset password
- Change password
- Third-party account structure

## Current Scope
This module uses BCrypt password hashing.
JWT and full Spring Security authorization will be implemented later.

## API Endpoints
- GET /api/auth/health
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- PUT /api/auth/change-password

## Test Account Flow
1. Register user:
POST /api/auth/register

2. Login user:
POST /api/auth/login
