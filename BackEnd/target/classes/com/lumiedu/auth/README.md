# Auth Module

This module manages authentication and account security for LumiEdu / AI Study Hub.

## Main Features
- Register new account
- Login account
- Forgot password
- Reset password
- Change password
- Link third-party accounts
- Disconnect third-party accounts

## Current Scope
This module currently provides basic authentication logic without JWT and without full Spring Security filter.

Password is hashed using BCrypt.

Forgot password currently returns reset token directly for development/testing.
Later, the token should be sent through email.

## Package Structure
- entity
- enums
- repository
- service
- controller
- dto
- config

## Important Notes
- User entity belongs to user module.
- Auth module depends on UserRepository.
- JWT, refresh token, email verification, and real OAuth login will be implemented later.
