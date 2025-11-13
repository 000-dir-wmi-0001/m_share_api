# Frontend Integration Documentation Index

## 📚 Complete Documentation for M-Share Upload API

This documentation package provides everything frontend developers need to integrate file upload functionality into M-Share applications.

---

## 📄 Documentation Files

### 1. **PROJECT_UPLOAD_API_ENDPOINTS.md** ⭐ (Start here!)
   - **Purpose**: Complete API reference documentation
   - **Contents**:
     - 5 upload endpoints with full specifications
     - Request/response examples for each endpoint
     - Error handling and status codes
     - Frontend integration examples (React components)
     - Fetch API helper implementations
     - Common use cases and workflows
     - Performance guidelines and tips
     - cURL testing examples
   - **Best for**: Understanding the complete API structure

### 2. **PROJECT_UPLOAD_API_QUICK_REFERENCE.md** ⚡ (Quick start)
   - **Purpose**: Fast reference guide for common tasks
   - **Contents**:
     - 5-minute quick start guide
     - API endpoints summary table
     - Response examples
     - JavaScript helper functions
     - React hooks (useProjectTree, useUploadStatus)
     - Common errors and solutions
     - Storage calculation helpers
     - Security notes
   - **Best for**: Quick lookup during development

### 3. **PROJECT_UPLOAD_API_TYPES.ts** 📘 (TypeScript support)
   - **Purpose**: Complete TypeScript type definitions
   - **Contents**:
     - All request/response interfaces
     - Enum definitions (UploadStatus, FileType, etc.)
     - React component prop types
     - State management types
     - API client interface
     - Utility types and helpers
     - Constants and endpoints
     - HTTP status codes
   - **Best for**: TypeScript projects with strict typing

---

## 🎯 Quick Navigation

### For Different Roles

**Frontend Developer (Starting Fresh)**
1. Read: [Quick Reference](./PROJECT_UPLOAD_API_QUICK_REFERENCE.md) - 5 min
2. Read: [Full Endpoints](./PROJECT_UPLOAD_API_ENDPOINTS.md) - 15 min
3. Copy: [TypeScript Types](./PROJECT_UPLOAD_API_TYPES.ts) into your project
4. Implement: Use React component examples

**React Developer**
1. Import: [TypeScript Types](./PROJECT_UPLOAD_API_TYPES.ts)
2. Reference: React hooks in [Quick Reference](./PROJECT_UPLOAD_API_QUICK_REFERENCE.md)
3. Copy: React components from [Full Endpoints](./PROJECT_UPLOAD_API_ENDPOINTS.md#react-component-file-tree-display)

**Backend Developer (Integration)**
1. Reference: [API Endpoints](./PROJECT_UPLOAD_API_ENDPOINTS.md) section 1-5
2. Check: Response examples and status codes
3. Test: cURL examples at bottom of [Full Endpoints](./PROJECT_UPLOAD_API_ENDPOINTS.md#testing-endpoints-with-curl)

**Mobile Developer (React Native)**
1. Use: Fetch API examples from [Quick Reference](./PROJECT_UPLOAD_API_QUICK_REFERENCE.md#-javascript-helpers)
2. Import: TypeScript types from [TYPES file](./PROJECT_UPLOAD_API_TYPES.ts)
3. Adapt: React examples to React Native (remove DOM APIs)

---

## 🚀 5-Minute Quick Start

```javascript
// 1. Login
const login = await fetch('/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'pass' })
});
const { access_token } = await login.json();

// 2. Create project
const project = await fetch('/v1/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({ name: 'My Project' })
});
const { id: projectId } = await project.json();

// 3. Upload ZIP
const formData = new FormData();
formData.append('file', zipFile);
await fetch(`/v1/projects/${projectId}/upload`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${access_token}` },
  body: formData
});

// 4. Check status every 2 seconds
const checkStatus = () => fetch(`/v1/projects/${projectId}/upload-status`, {
  headers: { 'Authorization': `Bearer ${access_token}` }
}).then(r => r.json());

// 5. Get tree when done
const tree = await fetch(`/v1/projects/${projectId}/tree`, {
  headers: { 'Authorization': `Bearer ${access_token}` }
}).then(r => r.json());
```

---

## 📋 API Summary

| Endpoint | Purpose | Status | Response |
|----------|---------|--------|----------|
| `POST /projects/:id/upload` | Upload ZIP | 202 | uploadId |
| `GET /projects/:id/upload-status` | Check progress | 200 | status, progress |
| `GET /projects/:id/tree` | File hierarchy | 200 | root, itemCount |
| `GET /projects/:id/folders/:folderId/children` | List folder | 200 | array of items |
| `GET /projects/:id/files/:fileId/content` | Download URL | 200 | url, fileName |

---

## 🎨 UI Component Examples

### File Tree Display
- See: [PROJECT_UPLOAD_API_ENDPOINTS.md#react-component-file-tree-display](./PROJECT_UPLOAD_API_ENDPOINTS.md#react-component-file-tree-display)
- Recursive folder/file rendering
- TypeScript types included

### Upload Progress Bar
- See: [PROJECT_UPLOAD_API_ENDPOINTS.md#react-component-file-upload-with-progress](./PROJECT_UPLOAD_API_ENDPOINTS.md#react-component-file-upload-with-progress)
- Real-time progress polling
- Error handling
- Upload completion feedback

---

## 🔧 Integration Patterns

### Pattern 1: Simple Upload + Display
```
User selects ZIP 
  → Upload to server 
  → Poll status 
  → Get tree 
  → Display files
```

### Pattern 2: Folder-by-Folder Browse
```
User clicks folder 
  → Get folder children 
  → Display in modal/sidebar 
  → Repeat on folder click
```

### Pattern 3: File Download
```
User clicks file 
  → Get content URL 
  → Open in new tab 
  → OR download via link
```

---

## 📊 Response Time Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| Upload (ZIP) | 100-200ms | Returns immediately (async) |
| Status Check | 50-100ms | In-memory lookup |
| Get Tree | 200-500ms | Depends on tree depth |
| Get Folder | 100-200ms | Just one folder level |
| Download URL | 50ms | Direct URL return |

---

## 🔐 Authentication Flow

```
1. User registers/logs in
   → GET access_token
   
2. Store token securely (NOT localStorage)
   → Use httpOnly cookies or session
   
3. Include in all requests
   → Header: Authorization: Bearer {token}
   
4. On token expiry
   → Use refresh_token to get new token
   → Or redirect to login
```

---

## ⚠️ Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token missing/expired | Re-login and get new token |
| 403 Forbidden | Not project owner | Use correct project ID |
| 404 Not Found | Resource doesn't exist | Verify IDs before request |
| 400 Bad Request | Invalid file/format | Check file is ZIP, <2GB |
| CORS Error | Wrong origin | Check API base URL |

---

## 📝 Best Practices

### 1. Error Handling
```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    // Handle specific errors
  }
  return await response.json();
} catch (error) {
  // Network error
}
```

### 2. File Validation
```javascript
// Before upload
if (!file.type === 'application/zip') throw new Error('Must be ZIP');
if (file.size > 2 * 1024 * 1024 * 1024) throw new Error('Max 2GB');
```

### 3. Token Management
```javascript
// Use secure storage
const token = sessionStorage.getItem('token'); // or cookies

// Never expose in logs
console.log('API Response:', { /* sanitized */ });
```

### 4. Performance
```javascript
// Cache tree in state, refresh on demand
const [tree, setTree] = useState(null);
const refreshTree = () => fetch(`/projects/${id}/tree`);

// Debounce status checks
let lastCheck = 0;
const checkStatus = () => {
  if (Date.now() - lastCheck < 2000) return;
  lastCheck = Date.now();
  // check
};
```

---

## 🧪 Testing

### Test with cURL

```bash
# Set your token
TOKEN="your_jwt_token"
PROJECT_ID="550e8400-e29b-41d4-a716-446655440000"

# Upload
curl -X POST http://localhost:3000/v1/projects/$PROJECT_ID/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@project.zip"

# Check status
curl http://localhost:3000/v1/projects/$PROJECT_ID/upload-status \
  -H "Authorization: Bearer $TOKEN"

# Get tree
curl http://localhost:3000/v1/projects/$PROJECT_ID/tree \
  -H "Authorization: Bearer $TOKEN"
```

### Test with Postman

1. Create environment variable: `token` = your JWT
2. Create environment variable: `baseUrl` = `http://localhost:3000/v1`
3. Import requests:
   - POST `{{baseUrl}}/projects/{projectId}/upload`
   - GET `{{baseUrl}}/projects/{projectId}/upload-status`
   - GET `{{baseUrl}}/projects/{projectId}}/tree`
4. Add header: `Authorization: Bearer {{token}}`

---

## 📞 Support & Resources

### Documentation Links
- [Complete API Endpoints](./PROJECT_UPLOAD_API_ENDPOINTS.md)
- [Quick Reference Guide](./PROJECT_UPLOAD_API_QUICK_REFERENCE.md)
- [TypeScript Types](./PROJECT_UPLOAD_API_TYPES.ts)

### File Size Guidelines
- **Max ZIP size**: 2 GB
- **Max single file**: 512 MB
- **Recommended**: Keep under 500 MB for faster processing

### Environment URLs
- **Development**: `http://localhost:3000/v1`
- **Staging**: `https://staging-api.mshare.app/v1`
- **Production**: `https://api.mshare.app/v1`

---

## 🎓 Learning Resources

1. **First Time?** → Read [Quick Reference](./PROJECT_UPLOAD_API_QUICK_REFERENCE.md)
2. **Building Component?** → Check [React Examples](./PROJECT_UPLOAD_API_ENDPOINTS.md#react-component-file-tree-display)
3. **Using TypeScript?** → Import from [TYPES file](./PROJECT_UPLOAD_API_TYPES.ts)
4. **Debugging Issue?** → Check [Common Errors](./PROJECT_UPLOAD_API_QUICK_REFERENCE.md#-common-errors--solutions)
5. **Need Details?** → See [Full Endpoints](./PROJECT_UPLOAD_API_ENDPOINTS.md)

---

## 📄 File Structure

```
M-Share Backend
├── PROJECT_UPLOAD_API_ENDPOINTS.md      ← Full API Reference
├── PROJECT_UPLOAD_API_QUICK_REFERENCE.md ← Quick Start
├── PROJECT_UPLOAD_API_TYPES.ts          ← TypeScript Types
└── FRONTEND_INTEGRATION_INDEX.md        ← This file
```

---

## ✅ Checklist for Integration

- [ ] Read Quick Reference (5 min)
- [ ] Review Full Endpoints (15 min)
- [ ] Copy TypeScript types to project
- [ ] Create API client/helper
- [ ] Test authentication flow
- [ ] Test upload endpoint
- [ ] Test status polling
- [ ] Test tree retrieval
- [ ] Implement UI components
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test with actual ZIP files
- [ ] Performance testing
- [ ] Security review
- [ ] Deploy!

---

**Last Updated**: November 13, 2025
**Version**: 1.0.0
**API Version**: v1
