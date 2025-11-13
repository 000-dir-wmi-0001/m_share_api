# Upload Feature Testing Guide ✅

## Server Status
```
✅ M-Share API v1.0.0
✅ Environment: development
✅ Server: http://localhost:3000
✅ B2 Storage initialized - Bucket: mshare
✅ All 16 modules loaded
✅ All endpoints ready
```

## Test Scenarios

### Scenario 1: Upload Individual PDF File

**Step 1: Create a project**
```bash
curl -X POST http://localhost:3000/v1/projects \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PDF Project",
    "description": "Testing PDF upload",
    "visibility": "PRIVATE"
  }'
```

**Step 2: Upload a PDF file**
```bash
curl -X POST http://localhost:3000/v1/projects/<project_id>/upload \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "file=@/path/to/document.pdf"
```

**Step 3: Check upload status**
```bash
curl http://localhost:3000/v1/projects/<project_id>/upload-status \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Expected Response:**
```json
{
  "status": "COMPLETED",
  "progress": 100,
  "filesProcessed": 1,
  "totalFiles": 1,
  "foldersCreated": 0
}
```

**Step 4: View project tree**
```bash
curl http://localhost:3000/v1/projects/<project_id>/tree \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Expected Response:**
```json
{
  "id": "project-uuid",
  "name": "PDF Project",
  "children": [
    {
      "id": "item-uuid",
      "name": "document.pdf",
      "is_folder": false,
      "file_type": "DOCUMENT",
      "mime_type": "application/pdf",
      "size": 524288,
      "b2_url": "https://mshare.s3.us-east-005.backblazeb2.com/projectId/document.pdf"
    }
  ]
}
```

---

### Scenario 2: Upload Image File

**Step 1: Create a project**
```bash
curl -X POST http://localhost:3000/v1/projects \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Image Project",
    "description": "Testing image upload",
    "visibility": "PRIVATE"
  }'
```

**Step 2: Upload an image**
```bash
curl -X POST http://localhost:3000/v1/projects/<project_id>/upload \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "file=@/path/to/photo.jpg"
```

**Expected File Type:** `IMAGE`
**Expected MIME Type:** `image/jpeg`

---

### Scenario 3: Upload ZIP File with Folder Structure

**Step 1: Create a project**
```bash
curl -X POST http://localhost:3000/v1/projects \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ZIP Project",
    "description": "Testing ZIP extraction",
    "visibility": "PRIVATE"
  }'
```

**Step 2: Upload a ZIP file**
```bash
curl -X POST http://localhost:3000/v1/projects/<project_id>/upload \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "file=@/path/to/archive.zip"
```

**Server Logs (Watch for):**
```
📦 Processing ZIP file...
✅ ZIP file extracted successfully
📂 Created folder: docs
✅ File uploaded: document.pdf
✅ File uploaded: image.jpg
```

**Step 3: Check status (may take longer)**
```bash
curl http://localhost:3000/v1/projects/<project_id>/upload-status \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Expected Response:**
```json
{
  "status": "COMPLETED",
  "progress": 100,
  "filesProcessed": 5,
  "totalFiles": 5,
  "foldersCreated": 2
}
```

**Step 4: View tree with hierarchy**
```bash
curl http://localhost:3000/v1/projects/<project_id>/tree \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Expected Response (Hierarchical):**
```json
{
  "id": "project-uuid",
  "name": "ZIP Project",
  "children": [
    {
      "id": "folder-uuid",
      "name": "docs",
      "is_folder": true,
      "children": [
        {
          "id": "item-uuid",
          "name": "document.pdf",
          "is_folder": false,
          "file_type": "DOCUMENT",
          "b2_url": "https://..."
        }
      ]
    },
    {
      "id": "item-uuid",
      "name": "readme.txt",
      "is_folder": false,
      "file_type": "DOCUMENT",
      "b2_url": "https://..."
    }
  ]
}
```

---

### Scenario 4: Upload Source Code File

**File:** `main.ts` (TypeScript)

**Step 1: Create a project**
```bash
curl -X POST http://localhost:3000/v1/projects \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Code Project",
    "description": "Testing code upload",
    "visibility": "PRIVATE"
  }'
```

**Step 2: Upload a source file**
```bash
curl -X POST http://localhost:3000/v1/projects/<project_id>/upload \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "file=@/path/to/main.ts"
```

**Expected Response:**
```json
{
  "status": "COMPLETED",
  "filesProcessed": 1,
  "file_type": "CODE",
  "mime_type": "text/typescript"
}
```

---

### Scenario 5: Upload Multiple Files (Batch in ZIP)

**Create a test ZIP with:**
```
project-files/
├── documents/
│   ├── report.pdf
│   ├── proposal.docx
│   └── memo.txt
├── images/
│   ├── logo.png
│   ├── banner.jpg
│   └── icon.svg
├── code/
│   ├── app.ts
│   ├── utils.js
│   └── config.json
└── README.md
```

**Upload:**
```bash
curl -X POST http://localhost:3000/v1/projects/<project_id>/upload \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "file=@/path/to/project-files.zip"
```

**Expected Status:**
```json
{
  "status": "COMPLETED",
  "filesProcessed": 8,
  "foldersCreated": 3,
  "progress": 100
}
```

---

## File Type Detection

| Extension | Detected Type | FileType |
|-----------|--------------|----------|
| .pdf | application/pdf | DOCUMENT |
| .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document | DOCUMENT |
| .xlsx | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | DOCUMENT |
| .txt | text/plain | DOCUMENT |
| .jpg | image/jpeg | IMAGE |
| .png | image/png | IMAGE |
| .gif | image/gif | IMAGE |
| .svg | image/svg+xml | IMAGE |
| .mp4 | video/mp4 | VIDEO |
| .mov | video/quicktime | VIDEO |
| .ts | text/typescript | CODE |
| .js | text/javascript | CODE |
| .py | text/x-python | CODE |
| .java | text/x-java | CODE |
| .json | application/json | CODE |
| .zip | application/zip | ARCHIVE |
| .rar | application/x-rar-compressed | ARCHIVE |
| .unknown | application/octet-stream | OTHER |

---

## API Endpoints Reference

### Upload File
```
POST /v1/projects/:id/upload
Content-Type: multipart/form-data

Body:
  file: <file data>

Response: 202 Accepted
{
  "message": "Upload started. Processing in background.",
  "uploadId": "project-uuid"
}
```

### Get Upload Status
```
GET /v1/projects/:id/upload-status
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "PROCESSING|COMPLETED|FAILED",
  "progress": 0-100,
  "filesProcessed": number,
  "totalFiles": number,
  "foldersCreated": number,
  "error": "error message if FAILED"
}
```

### Get Project Tree
```
GET /v1/projects/:id/tree
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "name": "Project Name",
  "children": [
    {
      "id": "uuid",
      "name": "filename",
      "is_folder": false,
      "file_type": "CODE|DOCUMENT|IMAGE|VIDEO|ARCHIVE|OTHER",
      "mime_type": "mime/type",
      "size": 1024,
      "b2_url": "https://mshare.s3.us-east-005.backblazeb2.com/...",
      "children": []
    }
  ]
}
```

### Get Folder Children
```
GET /v1/projects/:id/folders/:folderId/children
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "uuid",
    "name": "file.pdf",
    "is_folder": false,
    "file_type": "DOCUMENT",
    "size": 2048
  }
]
```

### Download File
```
GET /v1/projects/:id/files/:fileId/content
Authorization: Bearer <token>

Response: 200 OK (binary file data)
Headers:
  Content-Disposition: attachment; filename="file.pdf"
  Content-Type: application/pdf
```

---

## Error Handling

### Authentication Error
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```
**Solution:** Include valid JWT token in Authorization header

### Project Not Found
```json
{
  "message": "Project not found",
  "statusCode": 404
}
```
**Solution:** Verify project ID is correct

### Upload Failed
```json
{
  "status": "FAILED",
  "error": "Failed to extract ZIP file: Error message"
}
```
**Solution:** Check file is a valid ZIP, has necessary permissions

### File Too Large
```json
{
  "message": "File too large",
  "statusCode": 413
}
```
**Solution:** Reduce file size or implement chunked upload

---

## Console Logging

Watch the server console for upload progress:

**ZIP Upload:**
```
📦 Processing ZIP file...
✅ ZIP file extracted successfully
📂 Created folder: src
✅ File uploaded: main.ts
✅ File uploaded: utils.ts
```

**Individual File Upload:**
```
📄 Processing single file: document.pdf
✅ File uploaded: document.pdf to B2
```

**B2 Upload Success:**
```
✅ File uploaded successfully: https://mshare.s3.us-east-005.backblazeb2.com/projectId/filename.ext
```

---

## Testing Checklist

- [ ] Can upload individual PDF file
- [ ] Can upload individual image file
- [ ] Can upload individual source code file
- [ ] Can upload ZIP with multiple files
- [ ] ZIP extraction creates correct folder structure
- [ ] Upload status shows correct file count
- [ ] Files appear in project tree
- [ ] File types are correctly detected
- [ ] B2 URLs are accessible
- [ ] Different file types get correct FileType enum value
- [ ] Error handling for invalid ZIP files
- [ ] Error handling for missing authentication
- [ ] Error handling for non-existent project

---

## Quick Test Command

**One-line test (after getting JWT token):**

```bash
# 1. Create project
PROJECT_ID=$(curl -s -X POST http://localhost:3000/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"test"}' | jq -r '.id')

# 2. Upload file
curl -X POST http://localhost:3000/v1/projects/$PROJECT_ID/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# 3. Check status
curl http://localhost:3000/v1/projects/$PROJECT_ID/upload-status \
  -H "Authorization: Bearer $TOKEN" | jq .

# 4. View tree
curl http://localhost:3000/v1/projects/$PROJECT_ID/tree \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Performance Notes

- **Upload Processing:** Async (returns 202 immediately)
- **ZIP Extraction:** Depends on file size (typically < 5 seconds)
- **B2 Upload:** Network dependent (typically 1-3 seconds per file)
- **Progress Tracking:** Updated in real-time from in-memory Map
- **Cleanup:** Temp files cleaned up automatically after processing

---

**Last Updated:** 2024
**Status:** Ready for Testing ✅
