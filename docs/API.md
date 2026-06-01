# MediStore Pro — REST API Documentation
**Base URL:** `http://localhost:8000/api/v1`
**Auth:** All endpoints (except login) require `Authorization: Bearer <access_token>`

---

## Authentication

### POST `/auth/login/`
Obtain JWT tokens.

**Request**
```json
{ "email": "admin@medistore.com", "password": "Admin@1234" }
```
**Response 200**
```json
{
  "success": true,
  "data": {
    "access": "<jwt>",
    "refresh": "<jwt>",
    "token_type": "Bearer",
    "user": {
      "id": "uuid",
      "email": "admin@medistore.com",
      "full_name": "System Admin",
      "role": "ADMIN",
      "is_active": true
    }
  }
}
```
**Error 401**
```json
{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password.", "details": {} } }
```

---

### POST `/auth/token/refresh/`
Rotate refresh token and get new access token.

**Request**
```json
{ "refresh": "<refresh_jwt>" }
```
**Response 200**
```json
{ "access": "<new_jwt>", "refresh": "<new_refresh_jwt>" }
```

---

### POST `/auth/logout/`
Blacklist refresh token (invalidates session).

**Request**
```json
{ "refresh": "<refresh_jwt>" }
```
**Response 200**
```json
{ "success": true, "message": "Logged out successfully." }
```

---

### GET `/auth/me/`
Get current authenticated user's profile.

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "pharmacist@medistore.com",
    "first_name": "Ravi",
    "last_name": "Sharma",
    "full_name": "Ravi Sharma",
    "phone": "+91-9000000002",
    "role": "PHARMACIST",
    "avatar": null,
    "is_active": true,
    "last_login": "2026-06-01T09:00:00Z",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### PUT `/auth/me/`
Update own profile (first_name, last_name, phone, avatar).

**Request**
```json
{ "first_name": "Ravi", "last_name": "Kumar", "phone": "+91-9000000099" }
```

---

### POST `/auth/change-password/`
Change own password.

**Request**
```json
{
  "old_password": "Pharma@1234",
  "new_password": "NewSecure@5678",
  "confirm_new_password": "NewSecure@5678"
}
```
**Response 200**
```json
{ "success": true, "message": "Password changed successfully." }
```

---

## User Management *(Admin only)*

### GET `/auth/users/`
List all users with pagination.

**Query params:** `?role=PHARMACIST&is_active=true&search=ravi&page=1&page_size=20`

**Response 200**
```json
{
  "count": 4,
  "total_pages": 1,
  "current_page": 1,
  "next": null,
  "previous": null,
  "results": [ { ...user } ]
}
```

---

### POST `/auth/users/`
Create a new user.

**Request**
```json
{
  "email": "new@medistore.com",
  "first_name": "Test",
  "last_name": "User",
  "phone": "+91-9000000010",
  "role": "CASHIER",
  "password": "Test@1234",
  "confirm_password": "Test@1234"
}
```
**Response 201**
```json
{ "success": true, "data": { ...user } }
```

---

### GET `/auth/users/{uuid}/`
Get user by ID.

### PUT `/auth/users/{uuid}/`
Update user (role, active status, name).

### DELETE `/auth/users/{uuid}/`
Soft-deactivate user (sets `is_active=false`).

---

## Audit Logs *(Admin only)*

### GET `/auth/audit-logs/`
**Query params:** `?action=LOGIN&success=true&search=admin@`

**Response 200**
```json
{
  "results": [
    {
      "id": 1,
      "user_email": "admin@medistore.com",
      "action": "LOGIN",
      "resource": "auth",
      "ip_address": "192.168.1.1",
      "success": true,
      "created_at": "2026-06-01T09:00:00Z"
    }
  ]
}
```

---

## Standard Error Envelope
All errors follow this structure:
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | ...",
    "message": "Human-readable summary",
    "details": { "field_name": ["Validation error message"] }
  }
}
```

---

## Role Permissions Matrix

| Endpoint                      | ADMIN | PHARMACIST | CASHIER | INVENTORY_MGR |
|-------------------------------|:-----:|:----------:|:-------:|:-------------:|
| POST /auth/login/             | ✓     | ✓          | ✓       | ✓             |
| GET  /auth/me/                | ✓     | ✓          | ✓       | ✓             |
| PUT  /auth/me/                | ✓     | ✓          | ✓       | ✓             |
| POST /auth/change-password/   | ✓     | ✓          | ✓       | ✓             |
| GET  /auth/users/             | ✓     | ✗          | ✗       | ✗             |
| POST /auth/users/             | ✓     | ✗          | ✗       | ✗             |
| DEL  /auth/users/{id}/        | ✓     | ✗          | ✗       | ✗             |
| GET  /auth/audit-logs/        | ✓     | ✗          | ✗       | ✗             |
