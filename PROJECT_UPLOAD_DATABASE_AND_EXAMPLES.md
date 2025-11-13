# Project Upload - Database Schema & API Examples

**Document Version:** 1.0  
**Status:** Production Ready  
**Last Updated:** November 2024

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Complete API Examples](#complete-api-examples)
3. [Error Handling Guide](#error-handling-guide)
4. [Performance Metrics](#performance-metrics)
5. [Security Checklist](#security-checklist)

---

## Database Schema

### Projects Table

```sql
CREATE TABLE projects (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE,
  
  -- Status & Visibility
  status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'READY', 'FAILED') DEFAULT 'DRAFT',
  visibility ENUM('PUBLIC', 'PRIVATE') DEFAULT 'PRIVATE',
  
  -- Security
  is_password_protected BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  
  -- Statistics
  item_count INTEGER DEFAULT 0,
  storage_used BIGINT DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner_status (owner_id, status),
  INDEX idx_visibility_created (visibility, created_at),
  INDEX idx_slug (slug)
);
```

### Nodes Table (File Tree)

```sql
CREATE TABLE nodes (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  parent_id UUID,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  type ENUM('FILE', 'FOLDER'),
  path VARCHAR(2048),
  
  -- File Metadata
  mime_type VARCHAR(100),
  size BIGINT DEFAULT 0,
  
  -- Storage References
  b2_file_id VARCHAR(255),
  b2_url VARCHAR(2048),
  checksum VARCHAR(64),
  
  -- Ordering
  order_index INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE,
  INDEX idx_project_parent (project_id, parent_id),
  INDEX idx_project_type (project_id, type),
  INDEX idx_path (path)
);
```

### Activities Table

```sql
CREATE TABLE activities (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  
  -- Activity Info
  type VARCHAR(100),
  action VARCHAR(255),
  description TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_created (project_id, created_at),
  INDEX idx_user_created (user_id, created_at)
);
```

### Upload Progress Table (Optional)

```sql
CREATE TABLE upload_progress (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Progress Tracking
  total_files INTEGER,
  processed_files INTEGER DEFAULT 0,
  total_size BIGINT,
  uploaded_size BIGINT DEFAULT 0,
  
  -- Status
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
  error_message TEXT,
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_project_status (project_id, status)
);
```

### Indexes for Optimization

```sql
-- For common queries
CREATE INDEX idx_projects_owner_status ON projects(owner_id, status);
CREATE INDEX idx_projects_visibility ON projects(visibility);
CREATE INDEX idx_nodes_project_parent ON nodes(project_id, parent_id);
CREATE INDEX idx_nodes_b2_file_id ON nodes(b2_file_id);
CREATE INDEX idx_activities_project ON activities(project_id);

-- For search
CREATE FULLTEXT INDEX idx_projects_search ON projects(name, description);
CREATE INDEX idx_nodes_name ON nodes(name);
```

---

## Complete API Examples

### 1. Create Project

**Request:**
```bash
curl -X POST http://localhost:3000/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "My React Dashboard",
    "description": "Production React dashboard with TypeScript",
    "visibility": "PRIVATE",
    "is_password_protected": true,
    "password": "SecurePass123!"
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "proj-a1b2c3d4e5f6",
    "name": "My React Dashboard",
    "description": "Production React dashboard with TypeScript",
    "slug": "my-react-dashboard",
    "owner_id": "user-12345",
    "status": "DRAFT",
    "visibility": "PRIVATE",
    "is_password_protected": true,
    "member_count": 1,
    "item_count": 0,
    "storage_used": 0,
    "created_at": "2024-11-13T10:00:00Z",
    "updated_at": "2024-11-13T10:00:00Z"
  }
}
```

---

### 2. Upload ZIP File

**Request:**
```bash
curl -X POST http://localhost:3000/v1/projects/proj-a1b2c3d4e5f6/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/path/to/project.zip"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "projectId": "proj-a1b2c3d4e5f6",
    "uploadStatus": "PROCESSING",
    "message": "Upload received. Processing files...",
    "processId": "proc-xyz789",
    "estimatedTime": "45 seconds"
  }
}
```

**Important Notes:**
- ZIP must be valid (starts with `PK\x03\x04`)
- Maximum file size: 100MB
- Processing happens asynchronously
- User receives PROCESSING status immediately
- Check upload status with separate endpoint for progress

---

### 3. Check Upload Status

**Request:**
```bash
curl -X GET http://localhost:3000/v1/projects/proj-a1b2c3d4e5f6/upload-status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "projectId": "proj-a1b2c3d4e5f6",
    "status": "PROCESSING",
    "progress": 65,
    "processedFiles": 95,
    "totalFiles": 145,
    "currentFile": "src/components/Dashboard.tsx",
    "startedAt": "2024-11-13T10:05:00Z",
    "estimatedCompletion": "2024-11-13T10:07:30Z",
    "bytesProcessed": 3221225472,
    "totalBytes": 5242880000
  }
}
```

**Status Values:**
- `PENDING` - Queued for processing
- `PROCESSING` - Currently extracting/uploading (45-65% progress)
- `COMPLETED` - All files processed (100% progress, status also returned as READY)
- `FAILED` - Error occurred
- `READY` - Project ready for viewing

---

### 4. Get Project File Tree

**Request (Unauthenticated - Public Project):**
```bash
curl -X GET "http://localhost:3000/v1/projects/proj-a1b2c3d4e5f6/tree?depth=5"
```

**Request (Private Project):**
```bash
curl -X GET "http://localhost:3000/v1/projects/proj-a1b2c3d4e5f6/tree" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "projectId": "proj-a1b2c3d4e5f6",
    "tree": {
      "id": "node-root-abc123",
      "name": "proj-a1b2c3d4e5f6",
      "type": "FOLDER",
      "size": 5242880,
      "path": "/",
      "children": [
        {
          "id": "node-src-123",
          "name": "src",
          "type": "FOLDER",
          "size": 2097152,
          "path": "src",
          "children": [
            {
              "id": "node-index-456",
              "name": "index.tsx",
              "type": "FILE",
              "mime_type": "text/typescript",
              "size": 2048,
              "path": "src/index.tsx",
              "b2_url": "https://f123.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=...",
              "checksum": "a1b2c3d4e5f6...",
              "created_at": "2024-11-13T10:05:00Z"
            },
            {
              "id": "node-dashboard-789",
              "name": "Dashboard.tsx",
              "type": "FILE",
              "mime_type": "text/typescript",
              "size": 4096,
              "path": "src/Dashboard.tsx",
              "b2_url": "https://f123.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=...",
              "checksum": "f6e5d4c3b2a1...",
              "created_at": "2024-11-13T10:05:00Z"
            },
            {
              "id": "node-components-101",
              "name": "components",
              "type": "FOLDER",
              "size": 1048576,
              "path": "src/components",
              "children": [
                {
                  "id": "node-button-202",
                  "name": "Button.tsx",
                  "type": "FILE",
                  "mime_type": "text/typescript",
                  "size": 2048,
                  "path": "src/components/Button.tsx"
                }
              ]
            }
          ]
        },
        {
          "id": "node-public-303",
          "name": "public",
          "type": "FOLDER",
          "size": 1048576,
          "path": "public",
          "children": []
        },
        {
          "id": "node-package-404",
          "name": "package.json",
          "type": "FILE",
          "mime_type": "application/json",
          "size": 512,
          "path": "package.json",
          "b2_url": "https://f123.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=..."
        }
      ]
    },
    "summary": {
      "totalFiles": 145,
      "totalFolders": 32,
      "totalSize": 5242880,
      "fileTypes": {
        "typescript": 89,
        "javascript": 34,
        "json": 12,
        "css": 8,
        "other": 2
      }
    }
  }
}
```

---

### 5. Get File Content

**Request:**
```bash
curl -X GET "http://localhost:3000/v1/projects/proj-a1b2c3d4e5f6/files/node-index-456/content" \
  -H "Accept: application/json"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "node-index-456",
    "projectId": "proj-a1b2c3d4e5f6",
    "name": "index.tsx",
    "mime_type": "text/typescript",
    "size": 2048,
    "path": "src/index.tsx",
    "encoding": "utf-8",
    "lines": 45,
    "content": "import React from 'react';\nimport ReactDOM from 'react-dom';\nimport App from './App';\n\nReactDOM.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n  document.getElementById('root')\n);",
    "lastModified": "2024-11-13T10:05:00Z"
  }
}
```

**For Binary Files:**
```
HTTP/1.1 200 OK
Content-Type: image/png
Content-Disposition: inline; filename="logo.png"
Content-Length: 4096

[Binary PNG data]
```

---

### 6. Get Folder Contents

**Request:**
```bash
curl -X GET "http://localhost:3000/v1/projects/proj-a1b2c3d4e5f6/folders/node-src-123/children?sortBy=name&order=asc&limit=50"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "folderId": "node-src-123",
    "name": "src",
    "parent": "node-root-abc123",
    "children": [
      {
        "id": "node-index-456",
        "name": "index.tsx",
        "type": "FILE",
        "size": 2048,
        "mime_type": "text/typescript",
        "path": "src/index.tsx",
        "modified": "2024-11-13T10:05:00Z"
      },
      {
        "id": "node-dashboard-789",
        "name": "Dashboard.tsx",
        "type": "FILE",
        "size": 4096,
        "mime_type": "text/typescript",
        "path": "src/Dashboard.tsx",
        "modified": "2024-11-13T10:05:00Z"
      },
      {
        "id": "node-components-101",
        "name": "components",
        "type": "FOLDER",
        "size": 1048576,
        "path": "src/components",
        "modified": "2024-11-13T10:05:00Z"
      }
    ],
    "pagination": {
      "total": 3,
      "limit": 50,
      "offset": 0
    }
  }
}
```

---

### 7. Update Project

**Request:**
```bash
curl -X PUT http://localhost:3000/v1/projects/proj-a1b2c3d4e5f6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "My React Dashboard v2",
    "description": "Updated with new features",
    "visibility": "PUBLIC",
    "status": "PUBLISHED"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "proj-a1b2c3d4e5f6",
    "name": "My React Dashboard v2",
    "description": "Updated with new features",
    "visibility": "PUBLIC",
    "status": "PUBLISHED",
    "updated_at": "2024-11-13T10:15:00Z"
  }
}
```

---

### 8. Delete Project

**Request:**
```bash
curl -X DELETE http://localhost:3000/v1/projects/proj-a1b2c3d4e5f6 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:** `204 No Content`

---

## Error Handling Guide

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: name",
    "statusCode": 400
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing JWT token",
    "statusCode": 401
  }
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this project",
    "statusCode": 403
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project 'proj-invalid' not found",
    "statusCode": 404
  }
}
```

### 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Project slug 'my-project' already exists",
    "statusCode": 409
  }
}
```

### 413 Payload Too Large

```json
{
  "success": false,
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "File size exceeds maximum limit of 100MB",
    "statusCode": 413
  }
}
```

### 422 Unprocessable Entity

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ZIP",
    "message": "Invalid ZIP file format",
    "details": {
      "reason": "Missing end of central directory record"
    },
    "statusCode": 422
  }
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60,
    "statusCode": 429
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal server error occurred",
    "timestamp": "2024-11-13T10:00:00Z",
    "statusCode": 500
  }
}
```

---

## Performance Metrics

### Upload Performance

| Metric | Value | Notes |
|--------|-------|-------|
| ZIP extraction | ~50MB/sec | Depends on CPU |
| File upload to B2 | ~10-50MB/sec | Network dependent |
| Database insert | ~1000 nodes/sec | Batch operations |
| Total time (100MB) | ~30-60 seconds | Average case |
| Max file size | 100MB | Configurable |
| Max files | 10,000 | Per project |

### Database Performance

```sql
-- Query performance targets
-- Get project: < 10ms
SELECT * FROM projects WHERE id = 'proj-123';

-- Get tree (10K nodes): < 500ms
WITH RECURSIVE tree AS (
  SELECT * FROM nodes WHERE project_id = 'proj-123' AND parent_id IS NULL
  UNION ALL
  SELECT n.* FROM nodes n
  INNER JOIN tree t ON n.parent_id = t.id
)
SELECT * FROM tree;

-- Get folder children: < 100ms
SELECT * FROM nodes WHERE project_id = 'proj-123' AND parent_id = 'node-abc';

-- List projects: < 50ms
SELECT * FROM projects WHERE owner_id = 'user-123' LIMIT 50;
```

### Frontend Performance

```
Metric                          Target      Actual
─────────────────────────────────────────────────────
Initial tree render (100 files) < 100ms     ~80ms
Folder expand (1000 files)      < 200ms     ~150ms
File content load               < 500ms     ~300ms
Search (1000 files)             < 200ms     ~180ms
```

---

## Security Checklist

### Before Going to Production

- [ ] **Authentication**
  - [ ] JWT tokens have expiration (1 hour)
  - [ ] Refresh tokens are stored securely
  - [ ] Password reset flow implemented
  - [ ] 2FA optional but supported

- [ ] **Authorization**
  - [ ] Owner-only endpoints verified
  - [ ] Public/Private visibility respected
  - [ ] Password protection enforced
  - [ ] No privilege escalation vectors

- [ ] **File Validation**
  - [ ] ZIP signature validation (PK bytes)
  - [ ] Path traversal prevention (`..` check)
  - [ ] File size limits enforced
  - [ ] MIME type validation

- [ ] **Data Protection**
  - [ ] Password hashing (bcrypt, rounds ≥ 10)
  - [ ] Sensitive data not in logs
  - [ ] HTTPS only (TLS 1.3+)
  - [ ] CORS properly configured

- [ ] **Storage Security**
  - [ ] B2 API key rotation planned
  - [ ] Bucket versioning enabled
  - [ ] Signed URLs expire quickly (1 hour)
  - [ ] Deleted files cleanup scheduled

- [ ] **Rate Limiting**
  - [ ] Upload endpoint rate limited
  - [ ] Auth endpoints rate limited
  - [ ] API calls limited per user
  - [ ] DDoS protection enabled

- [ ] **Monitoring**
  - [ ] Error logging configured
  - [ ] Performance monitoring active
  - [ ] Security audit logging enabled
  - [ ] Alert system for anomalies

- [ ] **Compliance**
  - [ ] GDPR compliance verified
  - [ ] Data retention policy defined
  - [ ] Privacy policy updated
  - [ ] Terms of service agreed

### Security Headers

```typescript
// NestJS middleware
import { Express } from 'express';
import helmet from 'helmet';

export function configureSecurityHeaders(app: Express) {
  app.use(helmet());
  
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
  });
}
```

---

**Document Version:** 1.0  
**Status:** Production Ready  
**Last Updated:** November 2024  
**Next Review:** January 2025
