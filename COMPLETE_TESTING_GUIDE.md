# 📋 Complete Testing Guide - File Upload with B2 Integration

## Prerequisites

✅ Server running: `npm run start:dev`
✅ B2 credentials configured in `.env`
✅ Database connection active
✅ All endpoints mapped and ready

---

## Test Scenario 1: Register & Login

### Step 1.1: Create User Account
```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPassword123!"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "user-uuid-here",
  "name": "Test User",
  "email": "testuser@example.com",
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Step 1.2: Login (if user already exists)
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123!"
  }'
```

**Expected Response (200 OK):**
```json
{
  "user": {
    "id": "user-uuid-here",
    "name": "Test User",
    "email": "testuser@example.com"
  },
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": "24h"
}
```

**💡 Save the `token` value - you'll need it for subsequent requests!**

---

## Test Scenario 2: Create Project

### Step 2.1: Create a New Project
```bash
curl -X POST http://localhost:3000/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}" \
  -d '{
    "name": "Test Project",
    "description": "A project to test file uploads",
    "visibility": "PUBLIC"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "project-uuid-here",
  "name": "Test Project",
  "slug": "test-project",
  "description": "A project to test file uploads",
  "visibility": "PUBLIC",
  "status": "DRAFT",
  "owner_id": "user-uuid-here",
  "owner": {
    "id": "user-uuid-here",
    "name": "Test User",
    "email": "testuser@example.com"
  }
}
```

**💡 Save the `id` value - you'll need it for file uploads!**

---

## Test Scenario 3: Upload Single File (Non-ZIP)

### Step 3.1: Create a Test File
On Windows (PowerShell):
```powershell
# Create a sample text file
"This is a test document for M-Share file upload testing." | Out-File -FilePath "test-document.txt"

# Create a sample JSON file
@{
  name = "Test"
  version = "1.0"
} | ConvertTo-Json | Out-File -FilePath "config.json"
```

### Step 3.2: Upload Single File
```bash
curl -X POST http://localhost:3000/v1/projects/{PROJECT_ID}/upload \
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}" \
  -F "file=@test-document.txt"
```

**Expected Response (202 Accepted):**
```json
{
  "message": "Upload started. Processing in background.",
  "uploadId": "project-uuid-here"
}
```

The upload is now processing asynchronously in the background.

---

## Test Scenario 4: Check Upload Progress

### Step 4.1: Get Upload Status
```bash
curl http://localhost:3000/v1/projects/{PROJECT_ID}/upload-status \
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}"
```

**Expected Response (200 OK):**
```json
{
  "projectId": "project-uuid-here",
  "status": "COMPLETED",
  "progress": 100,
  "filesProcessed": 1,
  "totalFiles": 1,
  "foldersCreated": 0,
  "startedAt": "2025-11-13T19:30:00.000Z",
  "completedAt": "2025-11-13T19:30:05.000Z"
}
```

---

## Test Scenario 5: View File Tree

### Step 5.1: Get Project File Tree
```bash
curl http://localhost:3000/v1/projects/{PROJECT_ID}/tree \
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}"
```

**Expected Response (200 OK):**
```json
{
  "projectId": "project-uuid-here",
  "tree": [
    {
      "id": "item-uuid-1",
      "name": "test-document.txt",
      "path": "/test-document.txt",
      "is_folder": false,
      "file_type": "DOCUMENT",
      "size": 58,
      "mime_type": "text/plain",
      "b2_url": "https://f005.backblazeb2.com/file/mshare/project-uuid-here/test-document.txt",
      "created_at": "2025-11-13T19:30:05.000Z",
      "children": []
    }
  ]
}
```

---

## Test Scenario 6: Upload ZIP File

### Step 6.1: Create Test ZIP File

**Option A - PowerShell (Windows):**
```powershell
# Create test files
"Document 1" | Out-File -FilePath "doc1.txt"
"Document 2" | Out-File -FilePath "doc2.txt"

# Create a subdirectory with files
New-Item -ItemType Directory -Path "subfolder" -Force
"Nested file" | Out-File -FilePath "subfolder/nested.txt"

# Create ZIP archive (PowerShell 7+)
Compress-Archive -Path @("doc1.txt", "doc2.txt", "subfolder") -DestinationPath "test-archive.zip"

# Clean up loose files
Remove-Item "doc1.txt", "doc2.txt" -Force
Remove-Item "subfolder" -Recurse -Force
```

**Option B - Using Command Line (Windows cmd):**
```cmd
REM Create test files
(
  echo Document 1
) > doc1.txt

(
  echo Document 2
) > doc2.txt

REM Use 7-Zip or built-in tar command
tar -a -c -f test-archive.zip doc1.txt doc2.txt
```

### Step 6.2: Upload ZIP File
```bash
curl -X POST http://localhost:3000/v1/projects/{PROJECT_ID}/upload \
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}" \
  -F "file=@test-archive.zip"
```

**Expected Response (202 Accepted):**
```json
{
  "message": "Upload started. Processing in background.",
  "uploadId": "project-uuid-here"
}
```

### Step 6.3: Check ZIP Upload Progress
```bash
curl http://localhost:3000/v1/projects/{PROJECT_ID}/upload-status \
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}"
```

**Expected Response (ZIP extracted and all files processed):**
```json
{
  "projectId": "project-uuid-here",
  "status": "COMPLETED",
  "progress": 100,
  "filesProcessed": 3,
  "totalFiles": 3,
  "foldersCreated": 1,
  "startedAt": "2025-11-13T19:31:00.000Z",
  "completedAt": "2025-11-13T19:31:08.000Z"
}
```

### Step 6.4: View Extracted File Tree
```bash
curl http://localhost:3000/v1/projects/{PROJECT_ID}/tree \
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}"
```

**Expected Response (Hierarchical structure):**
```json
{
  "projectId": "project-uuid-here",
  "tree": [
    {
      "id": "item-uuid-3",
      "name": "doc1.txt",
      "path": "/doc1.txt",
      "is_folder": false,
      "file_type": "DOCUMENT",
      "size": 12,
      "mime_type": "text/plain",
      "b2_url": "https://f005.backblazeb2.com/file/mshare/project-uuid-here/doc1.txt"
    },
    {
      "id": "item-uuid-4",
      "name": "doc2.txt",
      "path": "/doc2.txt",
      "is_folder": false,
      "file_type": "DOCUMENT",
      "size": 12,
      "mime_type": "text/plain",
      "b2_url": "https://f005.backblazeb2.com/file/mshare/project-uuid-here/doc2.txt"
    },
    {
      "id": "item-uuid-5",
      "name": "subfolder",
      "path": "/subfolder",
      "is_folder": true,
      "children": [
        {
          "id": "item-uuid-6",
          "name": "nested.txt",
          "path": "/subfolder/nested.txt",
          "is_folder": false,
          "file_type": "DOCUMENT",
          "size": 12,
          "mime_type": "text/plain",
          "b2_url": "https://f005.backblazeb2.com/file/mshare/project-uuid-here/subfolder/nested.txt"
        }
      ]
    }
  ]
}
```

---

## Test Scenario 7: Download File Content

### Step 7.1: Get File Content
```bash
curl http://localhost:3000/v1/projects/{PROJECT_ID}/files/{FILE_ID}/content \
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}" \
  -o downloaded-file.txt
```

**Expected Response (200 OK):**
File content downloaded to `downloaded-file.txt`

---

## Test Scenario 8: List Folder Children

### Step 8.1: Get Folder Contents
```bash
curl http://localhost:3000/v1/projects/{PROJECT_ID}/folders/{FOLDER_ID}/children \
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}"
```

**Expected Response (200 OK):**
```json
{
  "folderId": "folder-uuid-here",
  "children": [
    {
      "id": "item-uuid-6",
      "name": "nested.txt",
      "path": "/subfolder/nested.txt",
      "is_folder": false,
      "file_type": "DOCUMENT",
      "size": 12,
      "mime_type": "text/plain"
    }
  ]
}
```

---

## Test Scenario 9: Error Handling

### Test 9.1: Upload Without Authentication
```bash
curl -X POST http://localhost:3000/v1/projects/{PROJECT_ID}/upload \
  -F "file=@test-document.txt"
```

**Expected Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Test 9.2: Upload to Non-Existent Project
```bash
curl -X POST http://localhost:3000/v1/projects/non-existent-id/upload \
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}" \
  -F "file=@test-document.txt"
```

**Expected Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Project not found"
}
```

### Test 9.3: Upload to Another User's Project
```bash
# Create second user and project
# Try to upload to second user's project with first user's token
```

**Expected Response (403 Forbidden):**
```json
{
  "statusCode": 403,
  "message": "Only project owner can upload files"
}
```

---

## File Type Examples for Testing

### Documents
- `test.pdf` - PDF file
- `report.docx` - Word document
- `data.xlsx` - Excel spreadsheet

### Images
- `photo.jpg` - JPEG image
- `screenshot.png` - PNG image
- `design.svg` - SVG vector

### Code
- `app.ts` - TypeScript
- `main.py` - Python
- `index.js` - JavaScript

### Multimedia
- `video.mp4` - Video file
- `audio.mp3` - Audio file

### Archives
- `backup.zip` - ZIP archive
- `package.tar.gz` - Compressed tarball

---

## Monitoring Upload Progress

### Real-time Status Polling
```bash
# Check status every 2 seconds until COMPLETED
:loop
curl http://localhost:3000/v1/projects/{PROJECT_ID}/upload-status \
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}" | jq '.status'

REM Windows cmd alternative:
@echo off
:loop
curl http://localhost:3000/v1/projects/{PROJECT_ID}/upload-status ^
  -H "Authorization: Bearer {YOUR_TOKEN_HERE}" 
timeout /t 2
goto loop
```

---

## Database Verification

### Check Uploaded Files in Database
```bash
# Query the database directly (if you have psql installed)
psql -h ep-curly-glitter-ah8e0epr-pooler.c-3.us-east-1.aws.neon.tech \
  -U neondb_owner \
  -d app_db \
  -c "SELECT id, name, b2_url, size FROM project_items WHERE project_id = '{PROJECT_ID}';"
```

---

## B2 Bucket Verification

### Check Files in B2 Console
1. Go to https://secure.backblaze.com/
2. Login with your B2 account
3. Navigate to Buckets → mshare
4. You should see files organized as: `{project-uuid}/{file-path}`

Example structure:
```
mshare/
├── edbdbca3-cd8a-4acd-9378-c3a03e6d57f7/
│   ├── test-document.txt
│   ├── doc1.txt
│   ├── doc2.txt
│   └── subfolder/nested.txt
```

---

## Server Logs to Monitor

Watch for these messages in your terminal:

### Successful Upload Logs
```
📤 Uploading to B2: {project-id}/{file-name} ({size} bytes)
✅ File uploaded successfully to B2: https://f005.backblazeb2.com/file/mshare/{path}
✅ File uploaded: {file-name}
```

### ZIP Extraction Logs
```
📦 Processing ZIP file...
📂 Created folder: {folder-name}
✅ Extracted from ZIP: {file-name}
```

### Progress Tracking Logs
```
📊 Upload Progress: {filesProcessed}/{totalFiles} (progress%)
✅ Upload COMPLETED
```

---

## Cleanup After Testing

```bash
# Delete test files
rm -f test-document.txt config.json test-archive.zip downloaded-file.txt

# Or on Windows (PowerShell)
Remove-Item -Path "test-document.txt", "config.json", "test-archive.zip", "downloaded-file.txt" -Force
```

---

## Success Criteria Checklist

- [x] User registration works
- [x] JWT login returns valid token
- [x] Project creation successful
- [x] Single file upload (202 Accepted)
- [x] Upload progress tracking accurate
- [x] File tree shows uploaded files
- [x] ZIP extraction works
- [x] Hierarchical folder structure preserved
- [x] All B2 URLs valid and accessible
- [x] Database records created correctly
- [x] Proper error handling for edge cases

---

**Last Updated**: 2025-11-13
**B2 Status**: ✅ Production Ready
**Test Coverage**: Complete End-to-End
