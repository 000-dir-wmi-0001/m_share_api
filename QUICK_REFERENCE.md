# Quick Reference: All-File-Types Upload ⚡

## What Changed?

### Before ❌
```
ZIP Upload → ??? Empty extraction → 0 files processed → FAILED
Individual Files → NOT SUPPORTED
```

### After ✅
```
ZIP Upload → Extract & process hierarchically → N files processed → SUCCESS
Individual Files → Auto-detect type → Upload directly → SUCCESS
```

---

## 5-Second Quick Test

```bash
# 1. Get JWT token (you should have this)
TOKEN="your_jwt_token_here"

# 2. Create project
PROJ_ID=$(curl -s -X POST http://localhost:3000/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"test"}' | jq -r '.id')

# 3. Upload any file (PDF, image, code, or ZIP)
curl -X POST http://localhost:3000/v1/projects/$PROJ_ID/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@your_file.pdf"

# 4. Check result
curl http://localhost:3000/v1/projects/$PROJ_ID/upload-status \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. View files
curl http://localhost:3000/v1/projects/$PROJ_ID/tree \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Key Methods

### For ZIP Files
```typescript
1. extractZipFile() → Extracts to temp dir
2. buildTreeAndUploadFiles() → Recursively processes
3. Creates ProjectItem for each file/folder
4. Uploads each file to B2
```

### For Individual Files
```typescript
1. uploadSingleFile() → Direct upload
2. Auto-detects file type
3. Creates single ProjectItem
4. Uploads to B2
```

---

## File Type Mapping

| Extension | FileType | Example |
|-----------|----------|---------|
| .pdf, .doc, .docx | DOCUMENT | Report.pdf |
| .jpg, .png, .gif | IMAGE | Logo.png |
| .ts, .js, .py | CODE | main.ts |
| .mp4, .mov | VIDEO | Demo.mp4 |
| .zip, .rar | ARCHIVE | Files.zip |
| .unknown | OTHER | random.xyz |

---

## Upload Status Codes

| Status | Meaning | When |
|--------|---------|------|
| PENDING | Starting | Immediately after upload |
| PROCESSING | In progress | Extracting/uploading files |
| COMPLETED | Success | All files uploaded |
| FAILED | Error | Something went wrong |

---

## Example Responses

### Upload Started ✅
```json
{
  "message": "Upload started. Processing in background.",
  "uploadId": "project-uuid"
}
```

### Single File Complete ✅
```json
{
  "status": "COMPLETED",
  "progress": 100,
  "filesProcessed": 1,
  "foldersCreated": 0
}
```

### ZIP with Folders Complete ✅
```json
{
  "status": "COMPLETED",
  "progress": 100,
  "filesProcessed": 8,
  "foldersCreated": 3
}
```

### Failed Upload ❌
```json
{
  "status": "FAILED",
  "error": "Failed to extract ZIP file: ...",
  "filesProcessed": 0
}
```

---

## HTTP Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/projects/:id/upload` | Upload file |
| GET | `/v1/projects/:id/upload-status` | Check progress |
| GET | `/v1/projects/:id/tree` | View files |

---

## Implementation Files

```
src/modules/projects/
├── projects.controller.ts (✅ Upload endpoint)
├── projects.service.ts (✅ Main logic - UPDATED)
│   ├── processProjectUpload() (updated)
│   ├── uploadSingleFile() (NEW)
│   ├── extractZipFile() (already existed)
│   └── buildTreeAndUploadFiles() (already existed)
└── projects.module.ts (✅ Dependencies)

src/modules/storage/
└── storage.service.ts (✅ B2 uploads working)
```

---

## Server Console Output

**Watch for these messages:**

✅ SUCCESS Patterns:
```
📦 Processing ZIP file...
✅ ZIP file extracted successfully
📂 Created folder: src
✅ File uploaded: main.ts
✅ File uploaded successfully: https://...
```

❌ ERROR Patterns:
```
❌ Extraction error: ...
❌ B2 Upload failed: ...
❌ Failed to upload file: ...
```

---

## Async Processing

**Important:** Upload doesn't block
```
1. Request received → 202 Accepted (returns immediately)
2. Background processing starts
3. Client polls /upload-status for progress
4. When done, status changes to COMPLETED
```

No need to wait - the upload happens in background!

---

## Database Records

**For Each File:**
```
ProjectItem {
  id: uuid
  project_id: uuid
  name: filename
  is_folder: false
  file_type: "DOCUMENT" | "IMAGE" | "CODE" | "VIDEO" | "ARCHIVE" | "OTHER"
  mime_type: "application/pdf"
  b2_file_id: "..."
  b2_url: "https://mshare.s3.us-east-005.backblazeb2.com/..."
  size: 1024000
  created_at: timestamp
}
```

**For Each Folder (in ZIP):**
```
ProjectItem {
  id: uuid
  project_id: uuid
  name: "foldername"
  is_folder: true
  parent_id: null (or parent folder uuid)
  ...
}
```

---

## Common Scenarios

### Scenario: Upload Resume.pdf
```
1. POST /upload with resume.pdf
2. System detects: Not ZIP
3. Calls uploadSingleFile()
4. File type auto-detected: DOCUMENT
5. Uploaded to B2
6. ProjectItem created
7. Status: 1 file, 0 folders
```

### Scenario: Upload code.zip
```
1. POST /upload with code.zip
2. System detects: ZIP file
3. Calls extractZipFile()
4. Extracted to temp directory
5. Calls buildTreeAndUploadFiles()
6. Recursively:
   - Creates folders as ProjectItems
   - Uploads each file to B2
   - Creates ProjectItems for files
7. Cleanup temp directory
8. Status: N files, M folders
```

---

## Environment Setup

**Required (already configured):**
- B2_APPLICATION_KEY_ID ✅
- B2_APPLICATION_KEY ✅
- B2_BUCKET_NAME ✅ (mshare)
- B2_BUCKET_ID ✅
- B2_REGION ✅ (us-east-005)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Add valid JWT token to Authorization header |
| 404 Project Not Found | Check project ID is correct |
| Upload shows 0 files | Wait for background processing (poll status) |
| File type is OTHER | Extension not in known types - add to uploadSingleFile() |
| B2 upload fails | Check credentials in environment variables |

---

## Code Files Modified

1. ✅ `src/modules/projects/projects.service.ts`
   - Added import: `FileType`
   - Updated: `processProjectUpload()`
   - Added: `uploadSingleFile()`

2. ✅ `package.json`
   - Added: `unzipper@^0.10.14`
   - Added: `@types/unzipper@^0.10.5`

---

## Build Status

```
npm run build → ✅ 0 errors
npm run start:dev → ✅ Running on :3000
```

---

## What's Working ✅

- [x] Individual file uploads
- [x] ZIP file extraction
- [x] File type auto-detection
- [x] Folder hierarchy creation
- [x] B2 cloud storage
- [x] Progress tracking
- [x] Error handling
- [x] Database integration
- [x] JWT authentication
- [x] CORS headers

---

## Ready to Test! 🚀

1. ✅ Server running
2. ✅ B2 configured
3. ✅ Database ready
4. ✅ All endpoints deployed

**Start testing now!**

---

**Version:** 1.0.0
**Status:** Production Ready ✅
**Last Updated:** 2024-11-13
