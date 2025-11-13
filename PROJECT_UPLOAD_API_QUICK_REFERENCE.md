# M-Share Upload API - Quick Reference

## 🚀 Quick Start

### 1. Get Authentication Token

```javascript
// Register
const register = await fetch('/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword',
    full_name: 'John Doe'
  })
});

// Or Login
const login = await fetch('/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword'
  })
});

const { access_token } = await login.json();
```

### 2. Create a Project

```javascript
const project = await fetch('/v1/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    name: 'My Project',
    description: 'Project description',
    visibility: 'PRIVATE'
  })
});

const { id: projectId } = await project.json();
```

### 3. Upload ZIP File

```javascript
const formData = new FormData();
formData.append('file', zipFileFromInput);

const upload = await fetch(`/v1/projects/${projectId}/upload`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${access_token}` },
  body: formData
});

const { uploadId } = await upload.json();
console.log('Upload started:', uploadId);
```

### 4. Check Upload Progress

```javascript
const checkProgress = async () => {
  const status = await fetch(`/v1/projects/${projectId}/upload-status`, {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  
  const { progress, status: uploadStatus } = await status.json();
  console.log(`Progress: ${progress}% - ${uploadStatus}`);
};

// Poll every 2 seconds
setInterval(checkProgress, 2000);
```

### 5. Get File Tree

```javascript
const tree = await fetch(`/v1/projects/${projectId}/tree`, {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

const { root, itemCount, storageUsed } = await tree.json();
console.log(`Files: ${itemCount}, Storage: ${storageUsed} bytes`);
```

---

## 📋 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/projects/:id/upload` | Upload ZIP file |
| GET | `/projects/:id/upload-status` | Check progress |
| GET | `/projects/:id/tree` | Get file tree |
| GET | `/projects/:id/folders/:folderId/children` | List folder |
| GET | `/projects/:id/files/:fileId/content` | Download URL |

---

## 🎯 Response Examples

### Upload Response (202 Accepted)
```json
{
  "message": "Upload started. Processing in background.",
  "uploadId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Upload Status Response (200 OK)
```json
{
  "projectId": "...",
  "status": "PROCESSING",
  "progress": 45,
  "filesProcessed": 23,
  "totalFiles": 50,
  "foldersCreated": 5,
  "startedAt": "2025-11-13T12:50:30.000Z",
  "completedAt": null
}
```

### File Tree Response (200 OK)
```json
{
  "projectId": "...",
  "projectName": "My React Project",
  "root": {
    "id": "...",
    "name": "src",
    "type": "FOLDER",
    "path": "/src",
    "children": [
      {
        "id": "...",
        "name": "Button.tsx",
        "type": "FILE",
        "mime_type": "text/typescript",
        "size": 2048,
        "b2_url": "https://..."
      }
    ]
  },
  "itemCount": 150,
  "storageUsed": 50331648
}
```

### File Content Response (200 OK)
```json
{
  "url": "https://s3.us-east-005.backblazeb2.com/...",
  "fileName": "Button.tsx"
}
```

---

## ⚡ Status Values

| Status | Meaning |
|--------|---------|
| PENDING | Upload queued |
| PROCESSING | Extracting and uploading |
| COMPLETED | Done ✓ |
| FAILED | Error occurred |

---

## 🔴 HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Data returned |
| 202 | Accepted | Upload processing |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Invalid/expired token |
| 403 | Forbidden | Not project owner |
| 404 | Not Found | Resource doesn't exist |

---

## 🛠️ JavaScript Helpers

### Setup API Client

```javascript
const API_BASE = 'http://localhost:3000/v1';
let token = null;

// Set token after login
function setToken(newToken) {
  token = newToken;
}

// API request helper
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
```

### Upload Files

```javascript
async function uploadProject(projectId, zipFile) {
  const formData = new FormData();
  formData.append('file', zipFile);

  return await fetch(`${API_BASE}/projects/${projectId}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  }).then(r => r.json());
}
```

### Poll Upload Status

```javascript
async function waitForUpload(projectId) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await apiCall(`/projects/${projectId}/upload-status`);
        
        if (status.status === 'COMPLETED') {
          clearInterval(interval);
          resolve(status);
        } else if (status.status === 'FAILED') {
          clearInterval(interval);
          reject(new Error(status.error));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 2000);
  });
}
```

### Get and Display Tree

```javascript
async function displayProjectTree(projectId) {
  const tree = await apiCall(`/projects/${projectId}/tree`);
  
  function renderNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    const icon = node.type === 'FOLDER' ? '📁' : '📄';
    console.log(`${indent}${icon} ${node.name}`);
    
    if (node.children) {
      node.children.forEach(child => renderNode(child, depth + 1));
    }
  }
  
  console.log(`\n📦 ${tree.projectName}`);
  renderNode(tree.root);
  console.log(`\n${tree.itemCount} files • ${(tree.storageUsed / 1024 / 1024).toFixed(2)} MB\n`);
}
```

### Download File

```javascript
async function downloadFile(projectId, fileId, fileName) {
  const { url } = await apiCall(`/projects/${projectId}/files/${fileId}/content`);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'file';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
```

---

## 📱 React Hooks

### useProjectTree

```javascript
import { useState, useEffect } from 'react';

function useProjectTree(projectId) {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    apiCall(`/projects/${projectId}/tree`)
      .then(setTree)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [projectId]);

  return { tree, loading, error };
}
```

### useUploadStatus

```javascript
import { useState, useEffect } from 'react';

function useUploadStatus(projectId, isUploading) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!isUploading) return;

    const interval = setInterval(async () => {
      try {
        const data = await apiCall(`/projects/${projectId}/upload-status`);
        setStatus(data);
        
        if (data.status !== 'PROCESSING') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [projectId, isUploading]);

  return status;
}
```

---

## 🔍 Common Errors & Solutions

### "401 Unauthorized"
- **Problem**: Token is missing or expired
- **Solution**: Re-login or get new token

### "403 Forbidden"
- **Problem**: Not the project owner
- **Solution**: Use correct project ID or create new project

### "404 Not Found"
- **Problem**: Project/file doesn't exist
- **Solution**: Verify IDs before API call

### "400 Bad Request"
- **Problem**: Invalid file or project status
- **Solution**: Check file format (must be ZIP) and project state

---

## 📊 Request/Response Times

- Upload request: **100-200ms** (async, returns immediately)
- Status check: **50-100ms**
- Get tree: **200-500ms**
- Get folder: **100-200ms**
- Download URL: **50ms**

---

## 💾 Storage Calculation

```javascript
// Format bytes to human readable
function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

// Example
const tree = await apiCall(`/projects/${projectId}/tree`);
console.log(`Storage used: ${formatBytes(tree.storageUsed)}`);
// Output: "Storage used: 50.33 MB"
```

---

## 🔐 Security Notes

1. **Never store tokens in localStorage** - Use secure cookies or session storage
2. **Validate file types** - Check for ZIP extension before upload
3. **Check file size** - Implement client-side size limits
4. **Use HTTPS** - Always in production
5. **Handle errors gracefully** - Never expose sensitive data in error messages

---

## 📚 Full Documentation

See [PROJECT_UPLOAD_API_ENDPOINTS.md](./PROJECT_UPLOAD_API_ENDPOINTS.md) for complete documentation.
