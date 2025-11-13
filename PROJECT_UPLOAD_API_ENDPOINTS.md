# M-Share Project Upload API - Frontend Integration Guide

## Overview

This document provides complete endpoint specifications for integrating file upload functionality into the frontend. All endpoints are prefixed with `/v1` and require JWT authentication (except where noted).

---

## Authentication

All endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

**Obtaining a Token:**
- Register: `POST /v1/auth/register`
- Login: `POST /v1/auth/login`
- Token will be returned in the response

---

## Project Upload Endpoints

### 1. Upload ZIP File to Project

**Endpoint:** `POST /v1/projects/:id/upload`

**Description:** Upload a ZIP file containing project files. Files are extracted and uploaded to B2 storage asynchronously.

**Authentication:** Required (Bearer Token)

**Parameters:**

| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| `id` | UUID | URL Path | Yes | Project ID |
| `file` | File | Form Data | Yes | ZIP file to upload (multipart/form-data) |

**Request Example:**

```javascript
const formData = new FormData();
formData.append('file', zipFileObject); // File object from input

const response = await fetch('/v1/projects/{projectId}/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Success Response (202 Accepted):**

```json
{
  "message": "Upload started. Processing in background.",
  "uploadId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**

| Status | Code | Message | Reason |
|--------|------|---------|--------|
| 400 | Bad Request | Invalid file or project status | ZIP file is corrupt or project is archived |
| 401 | Unauthorized | Missing or invalid token | JWT token not provided or expired |
| 403 | Forbidden | Only project owner can upload files | Current user is not the project owner |
| 404 | Not Found | Project not found | Project ID doesn't exist |

**CURL Example:**

```bash
curl -X POST http://localhost:3000/v1/projects/550e8400-e29b-41d4-a716-446655440000/upload \
  -H "Authorization: Bearer eyJhbGc..." \
  -F "file=@project.zip"
```

---

### 2. Check Upload Status

**Endpoint:** `GET /v1/projects/:id/upload-status`

**Description:** Get the current status of an ongoing or completed upload operation.

**Authentication:** Required (Bearer Token)

**Parameters:**

| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| `id` | UUID | URL Path | Yes | Project ID |

**Request Example:**

```javascript
const response = await fetch('/v1/projects/{projectId}/upload-status', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const uploadStatus = await response.json();
```

**Success Response (200 OK):**

```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PROCESSING",
  "progress": 45,
  "filesProcessed": 23,
  "totalFiles": 50,
  "foldersCreated": 5,
  "error": null,
  "startedAt": "2025-11-13T12:50:30.000Z",
  "completedAt": null
}
```

**Status Values:**

| Status | Description |
|--------|-------------|
| `PENDING` | Upload queued, waiting to start |
| `PROCESSING` | Currently extracting and uploading files |
| `COMPLETED` | Upload finished successfully |
| `FAILED` | Upload encountered an error |

**Error Response (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "Upload not found or already completed",
  "error": "Not Found"
}
```

**Frontend Implementation Example:**

```javascript
// Poll for upload status every 2 seconds
const pollUploadStatus = async (projectId, token) => {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`/v1/projects/${projectId}/upload-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        clearInterval(interval);
        return;
      }
      
      const status = await response.json();
      console.log(`Progress: ${status.progress}%`);
      
      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        clearInterval(interval);
        console.log(`Upload ${status.status.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Error checking upload status:', error);
      clearInterval(interval);
    }
  }, 2000);
};
```

---

### 3. Get Project File Tree

**Endpoint:** `GET /v1/projects/:id/tree`

**Description:** Retrieve the complete hierarchical file structure of a project.

**Authentication:** Required (Bearer Token)

**Parameters:**

| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| `id` | UUID | URL Path | Yes | Project ID |
| `depth` | Number | Query String | No | Maximum tree depth (default: 10, max: 50) |

**Request Examples:**

```javascript
// Basic request
const response = await fetch('/v1/projects/{projectId}/tree', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// With custom depth
const response = await fetch('/v1/projects/{projectId}/tree?depth=5', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Success Response (200 OK):**

```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "projectName": "My React Project",
  "root": {
    "id": "node-001",
    "name": "src",
    "type": "FOLDER",
    "path": "/src",
    "size": 0,
    "order": 0,
    "created_at": "2025-11-13T12:50:30.000Z",
    "updated_at": "2025-11-13T12:50:30.000Z",
    "children": [
      {
        "id": "node-002",
        "name": "components",
        "type": "FOLDER",
        "path": "/src/components",
        "size": 0,
        "order": 0,
        "created_at": "2025-11-13T12:50:30.000Z",
        "updated_at": "2025-11-13T12:50:30.000Z",
        "children": [
          {
            "id": "node-003",
            "name": "Button.tsx",
            "type": "FILE",
            "mime_type": "text/typescript",
            "size": 2048,
            "path": "/src/components/Button.tsx",
            "b2_url": "https://s3.us-east-005.backblazeb2.com/...",
            "order": 0,
            "created_at": "2025-11-13T12:50:30.000Z",
            "updated_at": "2025-11-13T12:50:30.000Z"
          },
          {
            "id": "node-004",
            "name": "Input.tsx",
            "type": "FILE",
            "mime_type": "text/typescript",
            "size": 1536,
            "path": "/src/components/Input.tsx",
            "b2_url": "https://s3.us-east-005.backblazeb2.com/...",
            "order": 1,
            "created_at": "2025-11-13T12:50:30.000Z",
            "updated_at": "2025-11-13T12:50:30.000Z"
          }
        ]
      },
      {
        "id": "node-005",
        "name": "App.tsx",
        "type": "FILE",
        "mime_type": "text/typescript",
        "size": 4096,
        "path": "/src/App.tsx",
        "b2_url": "https://s3.us-east-005.backblazeb2.com/...",
        "order": 1,
        "created_at": "2025-11-13T12:50:30.000Z",
        "updated_at": "2025-11-13T12:50:30.000Z"
      }
    ]
  },
  "itemCount": 150,
  "storageUsed": 50331648
}
```

**Error Response (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "Project not found",
  "error": "Not Found"
}
```

**File Type Mapping:**

| MIME Type | File Type | Icon Suggestion |
|-----------|-----------|-----------------|
| `text/typescript`, `text/javascript` | CODE | 📄 Code |
| `application/pdf` | DOCUMENT | 📋 Document |
| `image/png`, `image/jpeg` | IMAGE | 🖼️ Image |
| `video/mp4` | VIDEO | 🎬 Video |
| `application/zip` | ARCHIVE | 📦 Archive |
| `text/*`, `application/json` | DOCUMENT | 📄 File |

---

### 4. Get Folder Children (Pagination Alternative)

**Endpoint:** `GET /v1/projects/:id/folders/:folderId/children`

**Description:** List immediate children (files and folders) of a specific folder. Useful for paginated file browsing.

**Authentication:** Required (Bearer Token)

**Parameters:**

| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| `id` | UUID | URL Path | Yes | Project ID |
| `folderId` | String | URL Path | Yes | Folder ID or "root" for project root |

**Request Examples:**

```javascript
// Get root level items
const response = await fetch('/v1/projects/{projectId}/folders/root/children', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Get specific folder contents
const response = await fetch('/v1/projects/{projectId}/folders/{folderId}/children', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Success Response (200 OK):**

```json
[
  {
    "id": "node-001",
    "name": "src",
    "type": "FOLDER",
    "size": 0,
    "path": "/src",
    "order": 0,
    "created_at": "2025-11-13T12:50:30.000Z",
    "updated_at": "2025-11-13T12:50:30.000Z"
  },
  {
    "id": "node-002",
    "name": "package.json",
    "type": "FILE",
    "mime_type": "application/json",
    "size": 512,
    "path": "/package.json",
    "b2_url": "https://s3.us-east-005.backblazeb2.com/...",
    "order": 1,
    "created_at": "2025-11-13T12:50:30.000Z",
    "updated_at": "2025-11-13T12:50:30.000Z"
  }
]
```

**Error Response (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "Project or folder not found",
  "error": "Not Found"
}
```

---

### 5. Get File Content / Download URL

**Endpoint:** `GET /v1/projects/:id/files/:fileId/content`

**Description:** Get the downloadable/viewable URL for a file stored in B2 cloud storage.

**Authentication:** Required (Bearer Token)

**Parameters:**

| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| `id` | UUID | URL Path | Yes | Project ID |
| `fileId` | UUID | URL Path | Yes | File ID |

**Request Example:**

```javascript
const response = await fetch('/v1/projects/{projectId}/files/{fileId}/content', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { url, fileName } = await response.json();

// Use URL for download or preview
window.open(url, '_blank');
```

**Success Response (200 OK):**

```json
{
  "url": "https://s3.us-east-005.backblazeb2.com/mshare/project-abc/src/Button.tsx?signed=true",
  "fileName": "Button.tsx"
}
```

**Error Responses:**

| Status | Message | Reason |
|--------|---------|--------|
| 400 | Cannot get content of folder | File ID points to a folder, not a file |
| 400 | File not accessible | B2 URL not available |
| 404 | File not found | File ID doesn't exist or is in different project |

---

## Frontend Integration Examples

### React Component: File Tree Display

```jsx
import React, { useState, useEffect } from 'react';

const FileTree = ({ projectId, token }) => {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const response = await fetch(`/v1/projects/${projectId}/tree`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch tree');
        const data = await response.json();
        setTree(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [projectId, token]);

  const renderNode = (node, depth = 0) => (
    <div key={node.id} style={{ marginLeft: `${depth * 20}px` }}>
      <div>
        {node.type === 'FOLDER' ? '📁' : '📄'} {node.name}
        {node.type === 'FILE' && ` (${formatBytes(node.size)})`}
      </div>
      {node.children && node.children.map(child => renderNode(child, depth + 1))}
    </div>
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!tree) return <div>No tree data</div>;

  return (
    <div>
      <h2>{tree.projectName}</h2>
      <p>Files: {tree.itemCount} | Storage: {formatBytes(tree.storageUsed)}</p>
      {renderNode(tree.root)}
    </div>
  );
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default FileTree;
```

### React Component: File Upload with Progress

```jsx
import React, { useState } from 'react';

const FileUpload = ({ projectId, token, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload the file
      const uploadResponse = await fetch(`/v1/projects/${projectId}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');
      const uploadResult = await uploadResponse.json();

      // Poll for status
      const interval = setInterval(async () => {
        const statusResponse = await fetch(
          `/v1/projects/${projectId}/upload-status`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!statusResponse.ok) {
          clearInterval(interval);
          return;
        }

        const uploadStatus = await statusResponse.json();
        setProgress(uploadStatus.progress);
        setStatus(uploadStatus.status);

        if (uploadStatus.status === 'COMPLETED') {
          clearInterval(interval);
          setIsUploading(false);
          onUploadComplete?.();
        } else if (uploadStatus.status === 'FAILED') {
          clearInterval(interval);
          setIsUploading(false);
          alert(`Upload failed: ${uploadStatus.error}`);
        }
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".zip"
        onChange={handleFileUpload}
        disabled={isUploading}
      />
      {isUploading && (
        <div>
          <progress value={progress} max="100" />
          <p>{status} - {progress}%</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
```

### Fetch API Helper

```javascript
// api.js
class ProjectAPI {
  constructor(baseUrl = '/v1', token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...options.headers,
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  uploadProjectFiles(projectId, zipFile) {
    const formData = new FormData();
    formData.append('file', zipFile);

    return fetch(`${this.baseUrl}/projects/${projectId}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    }).then(r => r.json());
  }

  getUploadStatus(projectId) {
    return this.request(`/projects/${projectId}/upload-status`);
  }

  getProjectTree(projectId, depth = 10) {
    return this.request(`/projects/${projectId}/tree?depth=${depth}`);
  }

  getFolderChildren(projectId, folderId = 'root') {
    return this.request(`/projects/${projectId}/folders/${folderId}/children`);
  }

  getFileContent(projectId, fileId) {
    return this.request(`/projects/${projectId}/files/${fileId}/content`);
  }
}

export default ProjectAPI;
```

---

## Common Use Cases

### Use Case 1: Upload and Display Files

```javascript
// 1. User selects ZIP file
// 2. Upload to project
const uploadResult = await api.uploadProjectFiles(projectId, zipFile);

// 3. Poll for completion
while (true) {
  const status = await api.getUploadStatus(projectId);
  if (status.status === 'COMPLETED') break;
  if (status.status === 'FAILED') throw new Error(status.error);
  await new Promise(r => setTimeout(r, 1000));
}

// 4. Fetch and display tree
const tree = await api.getProjectTree(projectId);
displayTree(tree.root);
```

### Use Case 2: Browse Folders

```javascript
// Get root items
let items = await api.getFolderChildren(projectId);
displayItems(items);

// User clicks folder
const selectedFolder = items.find(f => f.type === 'FOLDER');
items = await api.getFolderChildren(projectId, selectedFolder.id);
displayItems(items);
```

### Use Case 3: Download File

```javascript
// User clicks file
const fileNode = /* selected file */;

if (fileNode.type === 'FILE') {
  const { url, fileName } = await api.getFileContent(projectId, fileNode.id);
  
  // Option 1: Open in new tab
  window.open(url, '_blank');
  
  // Option 2: Download
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
}
```

---

## Response Time Guidelines

| Operation | Typical Time | Notes |
|-----------|--------------|-------|
| Upload Request | 100-200ms | Returns immediately (async) |
| Status Check | 50-100ms | Quick in-memory lookup |
| Get Tree (100 files) | 200-500ms | Depends on tree depth |
| Get Folder Children | 100-200ms | Usually just 1-2 folders |
| Download URL | 50ms | Direct URL return |

---

## Error Handling

### Implement Retry Logic

```javascript
async function apiCallWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}

// Usage
const tree = await apiCallWithRetry(() => api.getProjectTree(projectId));
```

### Handle Common Errors

```javascript
try {
  const tree = await api.getProjectTree(projectId);
} catch (error) {
  if (error.status === 401) {
    // Token expired, redirect to login
  } else if (error.status === 403) {
    // Not project owner
  } else if (error.status === 404) {
    // Project not found
  } else {
    // Other error
  }
}
```

---

## Performance Tips

1. **Lazy Load Trees**: Only fetch tree when user opens file explorer
2. **Pagination**: Use `getFolderChildren()` for large folders instead of full tree
3. **Caching**: Cache tree in frontend state with optional refresh button
4. **Debounce**: Debounce upload status polling to every 2+ seconds
5. **Compression**: Ensure ZIP file is properly compressed before upload

---

## Testing Endpoints with cURL

```bash
# Set token variable
TOKEN="your_jwt_token_here"
PROJECT_ID="550e8400-e29b-41d4-a716-446655440000"

# Upload file
curl -X POST http://localhost:3000/v1/projects/$PROJECT_ID/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/project.zip"

# Check status
curl http://localhost:3000/v1/projects/$PROJECT_ID/upload-status \
  -H "Authorization: Bearer $TOKEN"

# Get tree
curl http://localhost:3000/v1/projects/$PROJECT_ID/tree \
  -H "Authorization: Bearer $TOKEN"

# Get folder children
curl http://localhost:3000/v1/projects/$PROJECT_ID/folders/root/children \
  -H "Authorization: Bearer $TOKEN"
```

---

## API Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000/v1` |
| Production | `https://api.mshare.app/v1` |

---

## Support

For issues or questions, please check:
- [Project Documentation](./PROJECT_UPLOAD_TECHNICAL_IMPLEMENTATION.md)
- [Database Schema](./PROJECT_UPLOAD_DATABASE_AND_EXAMPLES.md)
- API Error responses for specific error codes
