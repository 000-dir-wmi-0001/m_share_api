# M-Share API - Complete Endpoints Documentation

**Base URL:** `http://localhost:3000/v1`  
**Version:** 1.0.0  
**Total Endpoints:** 67

---

## Table of Contents

1. [Authentication](#authentication-7-endpoints)
2. [Users](#users-7-endpoints)
3. [Teams](#teams-6-endpoints)
4. [Team Members](#team-members-6-endpoints)
5. [Team Invitations](#team-invitations-6-endpoints)
6. [Projects](#projects-8-endpoints)
7. [Project Items](#project-items-5-endpoints)
8. [Project Files](#project-files-8-endpoints)
9. [Project Access](#project-access-5-endpoints)
10. [Activities](#activities-3-endpoints)
11. [Notifications](#notifications-6-endpoints)
12. [Donations](#donations-3-endpoints)
13. [Sponsorships](#sponsorships-5-endpoints)
14. [Settings](#settings-2-endpoints)
15. [Search](#search-3-endpoints)
16. [Analytics](#analytics-3-endpoints)
17. [Health Check](#health-check-1-endpoint)

---

## Authentication (7 endpoints)

### 1. Register
- **Method:** `POST`
- **Route:** `/auth/register`
- **Auth:** No
- **Payload:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phone": "+1234567890",
  "avatar_url": "/path/to/avatar.jpg",
  "bio": "Software Developer",
  "location": "San Francisco, USA",
  "timezone": "America/Los_Angeles"
}
```
- **Response:** `201 Created`
```json
{
  "id": "user-123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "country": "USA",
  "avatar_url": null,
  "created_at": "2024-11-09T00:00:00Z"
}
```

### 2. Login
- **Method:** `POST`
- **Route:** `/auth/login`
- **Auth:** No
- **Payload:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```
- **Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "country": "USA",
    "avatar_url": null,
    "created_at": "2024-11-09T00:00:00Z"
  }
}
```

### 3. Refresh Token
- **Method:** `POST`
- **Route:** `/auth/refresh`
- **Auth:** No
- **Payload:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Forgot Password
- **Method:** `POST`
- **Route:** `/auth/forgot-password`
- **Auth:** No
- **Payload:**
```json
{
  "email": "john@example.com"
}
```
- **Response:** `200 OK`
```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Password reset email sent"
}
```

### 5. Reset Password
- **Method:** `POST`
- **Route:** `/auth/reset-password`
- **Auth:** No
- **Payload:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePassword123!"
}
```
- **Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### 6. Verify Email
- **Method:** `GET`
- **Route:** `/auth/verify-email?token=<token>`
- **Auth:** No
- **Response:** `200 OK`
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### 7. Logout
- **Method:** `POST`
- **Route:** `/auth/logout`
- **Auth:** JWT Required
- **Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Users (7 endpoints)

### 1. Create User
- **Method:** `POST`
- **Route:** `/users`
- **Auth:** No
- **Payload:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "phone": "+1234567890",
  "country": "USA"
}
```
- **Response:** `201 Created`

### 2. Get Current User Profile
- **Method:** `GET`
- **Route:** `/users/me`
- **Auth:** JWT Required
- **Response:** `200 OK`
```json
{
  "id": "user-123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "country": "USA",
  "avatar_url": "/uploads/avatars/user-123-123456.jpg",
  "created_at": "2024-11-09T00:00:00Z",
  "email_verified": true,
  "last_login": "2024-11-09T10:00:00Z"
}
```

### 3. Update Current User Profile
- **Method:** `PUT`
- **Route:** `/users/me`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "name": "John Doe Updated",
  "phone": "+9876543210",
  "country": "Canada"
}
```
- **Response:** `200 OK`

### 4. Upload Avatar
- **Method:** `POST`
- **Route:** `/users/me/avatar`
- **Auth:** JWT Required
- **Content-Type:** `multipart/form-data`
- **Payload:**
```
avatar: <file>
```
- **Response:** `200 OK`
```json
{
  "id": "user-123",
  "avatar_url": "/uploads/avatars/user-123-123456.jpg"
}
```

### 5. Delete Avatar
- **Method:** `DELETE`
- **Route:** `/users/me/avatar`
- **Auth:** JWT Required
- **Response:** `200 OK`
```json
{
  "id": "user-123",
  "avatar_url": null
}
```

### 6. Change Password
- **Method:** `POST`
- **Route:** `/users/me/change-password`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "currentPassword": "SecurePassword123!",
  "newPassword": "NewSecurePassword123!"
}
```
- **Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 7. Get User by ID
- **Method:** `GET`
- **Route:** `/users/:id`
- **Auth:** No
- **Response:** `200 OK`

---

## Teams (6 endpoints)

### 1. Create Team
- **Method:** `POST`
- **Route:** `/teams`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "name": "Development Team",
  "description": "Our development team",
  "slug": "development-team",
  "is_private": false,
  "logo_url": "/logos/dev-team.png"
}
```
- **Response:** `201 Created`
```json
{
  "id": "team-123",
  "name": "Development Team",
  "description": "Our development team",
  "slug": "development-team",
  "status": "active",
  "created_at": "2024-11-09T00:00:00Z",
  "owner_id": "user-123",
  "is_private": false,
  "logo_url": "/logos/dev-team.png",
  "members_count": 1
}
```

### 2. Get All Teams
- **Method:** `GET`
- **Route:** `/teams?limit=10&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 10)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "team-123",
      "name": "Development Team",
      "description": "Our development team",
      "status": "active",
      "created_at": "2024-11-09T00:00:00Z",
      "members_count": 5
    }
  ],
  "total": 1
}
```

### 3. Get Team by ID
- **Method:** `GET`
- **Route:** `/teams/:id`
- **Auth:** No
- **Response:** `200 OK`

### 4. Get Team Stats
- **Method:** `GET`
- **Route:** `/teams/:id/stats`
- **Auth:** No
- **Response:** `200 OK`
```json
{
  "teamId": "team-123",
  "name": "Development Team",
  "memberCount": 5,
  "projectCount": 3,
  "createdAt": "2024-11-09T00:00:00Z",
  "status": "active"
}
```

### 5. Update Team
- **Method:** `PUT`
- **Route:** `/teams/:id`
- **Auth:** JWT Required (Owner only)
- **Payload:**
```json
{
  "name": "Development Team Updated",
  "description": "Updated description",
  "is_private": false,
  "logo_url": "/logos/dev-team-new.png"
}
```
- **Response:** `200 OK`

### 6. Delete Team
- **Method:** `DELETE`
- **Route:** `/teams/:id`
- **Auth:** JWT Required (Owner only)
- **Response:** `204 No Content`

---

## Team Members (6 endpoints)

### 1. Add Team Member
- **Method:** `POST`
- **Route:** `/teams/:teamId/members`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "user_id": "user-456",
  "role": "member"
}
```
- **Response:** `201 Created`
```json
{
  "id": "member-123",
  "team_id": "team-123",
  "user_id": "user-456",
  "role": "member",
  "status": "active",
  "joined_at": "2024-11-09T00:00:00Z"
}
```

### 2. Get Team Members
- **Method:** `GET`
- **Route:** `/teams/:teamId/members?limit=20&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 20)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "member-123",
      "team_id": "team-123",
      "user_id": "user-456",
      "role": "member",
      "status": "active",
      "joined_at": "2024-11-09T00:00:00Z"
    }
  ],
  "total": 1
}
```

### 3. Get Team Member by ID
- **Method:** `GET`
- **Route:** `/teams/:teamId/members/:id`
- **Auth:** No
- **Response:** `200 OK`

### 4. Update Team Member
- **Method:** `PUT`
- **Route:** `/teams/:teamId/members/:id`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "role": "admin",
  "status": "active"
}
```
- **Response:** `200 OK`

### 5. Remove Team Member
- **Method:** `DELETE`
- **Route:** `/teams/:teamId/members/:id`
- **Auth:** JWT Required
- **Response:** `204 No Content`

### 6. Search Team Members
- **Method:** `GET`
- **Route:** `/teams/:teamId/members/search?query=john&limit=10&offset=0`
- **Auth:** No
- **Query Params:**
  - `query`: String (required)
  - `limit`: Number (default: 10)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`

---

## Team Invitations (6 endpoints)

### 1. Create Team Invitation
- **Method:** `POST`
- **Route:** `/teams/:teamId/invitations`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```
- **Response:** `201 Created`
```json
{
  "id": "invitation-123",
  "team_id": "team-123",
  "email": "newmember@example.com",
  "role": "member",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "status": "pending",
  "created_at": "2024-11-09T00:00:00Z"
}
```

### 2. Get Team Invitations
- **Method:** `GET`
- **Route:** `/teams/:teamId/invitations?limit=20&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 20)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`

### 3. Accept Invitation
- **Method:** `POST`
- **Route:** `/teams/:teamId/invitations/accept/:token`
- **Auth:** No
- **Response:** `200 OK`
```json
{
  "success": true,
  "message": "Invitation accepted",
  "member_id": "member-123"
}
```

### 4. Reject Invitation
- **Method:** `POST`
- **Route:** `/teams/:teamId/invitations/reject/:token`
- **Auth:** No
- **Response:** `200 OK`
```json
{
  "success": true,
  "message": "Invitation rejected"
}
```

### 5. Get Invitation by ID
- **Method:** `GET`
- **Route:** `/teams/:teamId/invitations/:id`
- **Auth:** No
- **Response:** `200 OK`

### 6. Delete Invitation
- **Method:** `DELETE`
- **Route:** `/teams/:teamId/invitations/:id`
- **Auth:** JWT Required
- **Response:** `204 No Content`

---

## Projects (8 endpoints)

### 1. Create Project
- **Method:** `POST`
- **Route:** `/projects`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "slug": "new-project",
  "visibility": "public",
  "team_id": "team-123",
  "is_password_protected": false,
  "password": "optional-password"
}
```
- **Response:** `201 Created`
```json
{
  "id": "project-123",
  "name": "New Project",
  "description": "Project description",
  "slug": "new-project",
  "status": "draft",
  "visibility": "public",
  "is_password_protected": false,
  "team_id": "team-123",
  "created_by": "user-123",
  "created_at": "2024-11-09T00:00:00Z"
}
```

### 2. Get All Projects
- **Method:** `GET`
- **Route:** `/projects?limit=10&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 10)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`

### 3. Get Project by ID
- **Method:** `GET`
- **Route:** `/projects/:id`
- **Auth:** No
- **Response:** `200 OK`

### 4. Get Project Stats
- **Method:** `GET`
- **Route:** `/projects/:id/stats`
- **Auth:** No
- **Response:** `200 OK`
```json
{
  "projectId": "project-123",
  "totalMembers": 5,
  "totalFiles": 12,
  "totalShares": 3,
  "totalComments": 8,
  "totalDownloads": 25,
  "createdAt": "2024-11-09T00:00:00Z"
}
```

### 5. Update Project
- **Method:** `PUT`
- **Route:** `/projects/:id`
- **Auth:** JWT Required (Owner only)
- **Payload:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "visibility": "private",
  "status": "active"
}
```
- **Response:** `200 OK`

### 6. Publish Project
- **Method:** `POST`
- **Route:** `/projects/:id/publish`
- **Auth:** JWT Required (Owner only)
- **Response:** `200 OK`

### 7. Archive Project
- **Method:** `POST`
- **Route:** `/projects/:id/archive`
- **Auth:** JWT Required (Owner only)
- **Response:** `200 OK`

### 8. Delete Project
- **Method:** `DELETE`
- **Route:** `/projects/:id`
- **Auth:** JWT Required (Owner only)
- **Response:** `204 No Content`

---

## Project Items (5 endpoints)

### 1. Create Project Item
- **Method:** `POST`
- **Route:** `/projects/:projectId/items`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "name": "Item Title",
  "description": "Item description",
  "content": "Item content or file data",
  "mime_type": "text/plain",
  "order": 1,
  "is_watermarked": false,
  "language": "en"
}
```
- **Response:** `201 Created`

### 2. Get Project Items
- **Method:** `GET`
- **Route:** `/projects/:projectId/items?limit=50&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 50)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`

### 3. Get Project Item by ID
- **Method:** `GET`
- **Route:** `/projects/:projectId/items/:id`
- **Auth:** No
- **Response:** `200 OK`

### 4. Update Project Item
- **Method:** `PUT`
- **Route:** `/projects/:projectId/items/:id`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "name": "Updated Title",
  "description": "Updated description",
  "content": "Updated content",
  "order": 2
}
```
- **Response:** `200 OK`

### 5. Delete Project Item
- **Method:** `DELETE`
- **Route:** `/projects/:projectId/items/:id`
- **Auth:** JWT Required
- **Response:** `204 No Content`

---

## Project Files (8 endpoints)

### 1. Upload File
- **Method:** `POST`
- **Route:** `/projects/:projectId/files`
- **Auth:** JWT Required
- **Content-Type:** `multipart/form-data`
- **Payload:**
```
file: <file>
folder: "documents" (optional)
description: "File description" (optional)
```
- **Response:** `201 Created`
```json
{
  "id": "file-123",
  "project_id": "project-123",
  "name": "document.pdf",
  "size": 1024000,
  "type": "document",
  "folder": "documents",
  "description": "File description",
  "uploaded_by": "user-123",
  "created_at": "2024-11-09T00:00:00Z"
}
```

### 2. Get Files
- **Method:** `GET`
- **Route:** `/projects/:projectId/files?limit=20&offset=0&folder=documents`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 20)
  - `offset`: Number (default: 0)
  - `folder`: String (optional)
- **Response:** `200 OK`

### 3. Get File by ID
- **Method:** `GET`
- **Route:** `/projects/:projectId/files/:fileId`
- **Auth:** No
- **Response:** `200 OK`

### 4. Update File
- **Method:** `PUT`
- **Route:** `/projects/:projectId/files/:fileId`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "name": "new-name.pdf",
  "description": "Updated description",
  "folder": "archives"
}
```
- **Response:** `200 OK`

### 5. Delete File
- **Method:** `DELETE`
- **Route:** `/projects/:projectId/files/:fileId`
- **Auth:** JWT Required
- **Response:** `204 No Content`

### 6. Download File
- **Method:** `GET`
- **Route:** `/projects/:projectId/files/:fileId/download`
- **Auth:** No
- **Response:** `200 OK`
```json
{
  "downloadUrl": "https://example.com/files/file-123",
  "fileName": "document.pdf"
}
```

### 7. Get File Versions
- **Method:** `GET`
- **Route:** `/projects/:projectId/files/:fileId/versions?limit=10&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 10)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "version-123",
      "file_id": "file-123",
      "version_number": 1,
      "size": 1024000,
      "created_by": "user-123",
      "created_at": "2024-11-09T00:00:00Z"
    }
  ],
  "total": 1
}
```

### 8. Download File Version
- **Method:** `GET`
- **Route:** `/projects/:projectId/files/:fileId/versions/:versionId/download`
- **Auth:** No
- **Response:** `200 OK`

---

## Project Access (5 endpoints)

### 1. Grant Project Access
- **Method:** `POST`
- **Route:** `/projects/:projectId/access`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "access_type": "view",
  "allow_download": true,
  "allow_share": false,
  "allow_view_notifications": true,
  "expires_at": "2024-12-09T00:00:00Z"
}
```
- **Response:** `201 Created`
```json
{
  "id": "access-123",
  "project_id": "project-123",
  "access_type": "view",
  "token": "access-token-123",
  "is_password_protected": false,
  "allow_download": true,
  "allow_share": false,
  "allow_view_notifications": true,
  "expires_at": "2024-12-09T00:00:00Z",
  "view_count": 0,
  "created_at": "2024-11-09T00:00:00Z"
}
```

### 2. Get Project Access
- **Method:** `GET`
- **Route:** `/projects/:projectId/access?limit=50&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 50)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`

### 3. Get Access by ID
- **Method:** `GET`
- **Route:** `/projects/:projectId/access/:id`
- **Auth:** No
- **Response:** `200 OK`

### 4. Update Project Access
- **Method:** `PUT`
- **Route:** `/projects/:projectId/access/:id`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "access_type": "edit",
  "allow_download": true,
  "allow_share": true,
  "allow_view_notifications": true,
  "expires_at": "2024-12-09T00:00:00Z"
}
```
- **Response:** `200 OK`

### 5. Remove Project Access
- **Method:** `DELETE`
- **Route:** `/projects/:projectId/access/:id`
- **Auth:** JWT Required
- **Response:** `204 No Content`

---

## Activities (3 endpoints)

### 1. Get Project Activities
- **Method:** `GET`
- **Route:** `/activities/projects/:projectId?limit=50&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 50)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "activity-123",
      "project_id": "project-123",
      "user_id": "user-123",
      "type": "file_uploaded",
      "description": "File uploaded",
      "metadata": {},
      "created_at": "2024-11-09T00:00:00Z"
    }
  ],
  "total": 10
}
```

### 2. Get User Activities
- **Method:** `GET`
- **Route:** `/activities/users/:userId?limit=50&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 50)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`

### 3. Get Team Activities
- **Method:** `GET`
- **Route:** `/activities/teams/:teamId?limit=50&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 50)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`

---

## Notifications (6 endpoints)

### 1. Get User Notifications
- **Method:** `GET`
- **Route:** `/notifications?limit=20&offset=0`
- **Auth:** JWT Required
- **Query Params:**
  - `limit`: Number (default: 20)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "notification-123",
      "user_id": "user-123",
      "type": "project_shared",
      "title": "Project Shared",
      "message": "Your project was shared",
      "status": "unread",
      "created_at": "2024-11-09T00:00:00Z"
    }
  ],
  "total": 5
}
```

### 2. Get Unread Count
- **Method:** `GET`
- **Route:** `/notifications/unread-count`
- **Auth:** JWT Required
- **Response:** `200 OK`
```json
{
  "unread_count": 3
}
```

### 3. Mark Notification as Read
- **Method:** `PUT`
- **Route:** `/notifications/:id`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "status": "read"
}
```
- **Response:** `200 OK`

### 4. Mark All as Read
- **Method:** `PUT`
- **Route:** `/notifications/mark-all-read/batch`
- **Auth:** JWT Required
- **Response:** `204 No Content`

### 5. Delete Notification
- **Method:** `DELETE`
- **Route:** `/notifications/:id`
- **Auth:** JWT Required
- **Response:** `204 No Content`

### 6. Archive Notification
- **Method:** `PUT`
- **Route:** `/notifications/:id/archive`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "archived": true
}
```
- **Response:** `200 OK`

---

## Donations (3 endpoints)

### 1. Create Donation
- **Method:** `POST`
- **Route:** `/donations`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "amount": 50.00,
  "currency": "USD",
  "payment_method": "stripe",
  "is_recurring": false,
  "recurring_frequency": "monthly",
  "message": "Great work!"
}
```
- **Response:** `201 Created`
```json
{
  "id": "donation-123",
  "user_id": "user-123",
  "amount": 50.00,
  "currency": "USD",
  "status": "completed",
  "payment_method": "stripe",
  "payment_id": "pi_123456",
  "is_recurring": false,
  "recurring_frequency": "monthly",
  "next_charge_date": null,
  "message": "Great work!",
  "receipt_url": "https://receipts.example.com/receipt-123",
  "created_at": "2024-11-09T00:00:00Z"
}
```

### 2. Get User Donations
- **Method:** `GET`
- **Route:** `/donations/users/:userId?limit=20&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 20)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`

### 3. Get Donation by ID
- **Method:** `GET`
- **Route:** `/donations/:id`
- **Auth:** No
- **Response:** `200 OK`

---

## Sponsorships (5 endpoints)

### 1. Create Sponsorship
- **Method:** `POST`
- **Route:** `/sponsorships`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "tier": "gold",
  "amount": 100.00,
  "currency": "USD",
  "start_date": "2024-11-09T00:00:00Z",
  "end_date": "2024-12-09T00:00:00Z",
  "auto_renew": true,
  "message": "Thanks for the sponsorship!"
}
```
- **Response:** `201 Created`
```json
{
  "id": "sponsorship-123",
  "user_id": "user-123",
  "tier": "gold",
  "amount": 100.00,
  "currency": "USD",
  "status": "active",
  "start_date": "2024-11-09T00:00:00Z",
  "end_date": "2024-12-09T00:00:00Z",
  "auto_renew": true,
  "message": "Thanks for the sponsorship!",
  "created_at": "2024-11-09T00:00:00Z"
}
```

### 2. Get User Sponsorships
- **Method:** `GET`
- **Route:** `/sponsorships/users/:userId?limit=20&offset=0`
- **Auth:** No
- **Query Params:**
  - `limit`: Number (default: 20)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`

### 3. Get Sponsorship by ID
- **Method:** `GET`
- **Route:** `/sponsorships/:id`
- **Auth:** No
- **Response:** `200 OK`

### 4. Update Sponsorship
- **Method:** `PUT`
- **Route:** `/sponsorships/:id`
- **Auth:** JWT Required
- **Payload:**
```json
{
  "status": "active",
  "auto_renew": true,
  "message": "Updated sponsorship message"
}
```
- **Response:** `200 OK`

### 5. Delete Sponsorship
- **Method:** `DELETE`
- **Route:** `/sponsorships/:id`
- **Auth:** JWT Required
- **Response:** `204 No Content`

---

## Settings (2 endpoints)

### 1. Get/Update User Settings
- **Method:** `GET/PUT`
- **Route:** `/settings/users/:userId`
- **Auth:** JWT Required
- **GET Response:** `200 OK`
```json
{
  "id": "setting-123",
  "user_id": "user-123",
  "language": "en",
  "timezone": "UTC",
  "notifications_enabled": true,
  "theme": "light"
}
```
- **PUT Payload:**
```json
{
  "language": "es",
  "timezone": "EST",
  "notifications_enabled": false,
  "theme": "dark"
}
```

### 2. Get/Update Team Settings
- **Method:** `GET/PUT`
- **Route:** `/settings/teams/:teamId`
- **Auth:** JWT Required
- **GET Response:** `200 OK`
```json
{
  "id": "setting-123",
  "team_id": "team-123",
  "privacy": "private",
  "allow_invitations": true,
  "require_email_verification": true
}
```

---

## Search (3 endpoints)

### 1. Search Projects
- **Method:** `GET`
- **Route:** `/search/projects?query=project&limit=20&offset=0`
- **Auth:** No
- **Query Params:**
  - `query`: String (required)
  - `limit`: Number (default: 20)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "project-123",
      "name": "Project Name",
      "description": "Description",
      "type": "project"
    }
  ],
  "total": 5
}
```

### 2. Search Users
- **Method:** `GET`
- **Route:** `/search/users?query=john&limit=20&offset=0`
- **Auth:** No
- **Query Params:**
  - `query`: String (required)
  - `limit`: Number (default: 20)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`

### 3. Search Teams
- **Method:** `GET`
- **Route:** `/search/teams?query=development&limit=20&offset=0`
- **Auth:** No
- **Query Params:**
  - `query`: String (required)
  - `limit`: Number (default: 20)
  - `offset`: Number (default: 0)
- **Response:** `200 OK`

---

## Analytics (3 endpoints)

### 1. Get User Analytics
- **Method:** `GET`
- **Route:** `/analytics/users/:userId`
- **Auth:** JWT Required
- **Response:** `200 OK`
```json
{
  "user_id": "user-123",
  "total_projects": 5,
  "total_teams": 3,
  "total_files_uploaded": 25,
  "total_downloads": 100,
  "total_donations_received": 500.00
}
```

### 2. Get Team Analytics
- **Method:** `GET`
- **Route:** `/analytics/teams/:teamId`
- **Auth:** JWT Required
- **Response:** `200 OK`
```json
{
  "team_id": "team-123",
  "total_members": 10,
  "total_projects": 5,
  "total_files": 50,
  "average_file_size": 2048000
}
```

### 3. Get Project Analytics
- **Method:** `GET`
- **Route:** `/analytics/projects/:projectId`
- **Auth:** JWT Required
- **Response:** `200 OK`
```json
{
  "project_id": "project-123",
  "total_views": 1500,
  "total_downloads": 250,
  "total_shares": 50,
  "top_countries": ["USA", "UK", "Canada"]
}
```

---

## Health Check (1 endpoint)

### 1. Health Check
- **Method:** `GET`
- **Route:** `/health`
- **Auth:** No
- **Response:** `200 OK`
```json
{
  "status": "ok",
  "environment": "development",
  "database": "connected",
  "timestamp": "2024-11-09T00:00:00Z",
  "version": "1.0.0",
  "endpoints": 67
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Authentication

### JWT Token Format
All authenticated requests should include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiration
- Access Token: 15 minutes (default)
- Refresh Token: 7 days (default)

---

## Rate Limiting

Currently no rate limiting is implemented. This should be added in production environments.

---

## Pagination

All list endpoints support pagination via query parameters:
- `limit`: Number of items per page (default varies by endpoint)
- `offset`: Starting position (default: 0)

---

## Last Updated
- **Date:** November 9, 2024
- **Version:** 1.0.0
- **Total Endpoints:** 67
