# M-Share: Project Creation & File Upload Flow

## Complete Backend Flow Documentation

---

## 📊 Overview Diagram

```
┌─────────────────┐
│   Frontend      │
│   (User)        │
└────────┬────────┘
         │
         │ 1. POST /v1/auth/login
         │
    ┌────▼─────────────────────────────────┐
    │  Authentication                      │
    │  ✓ Validates credentials             │
    │  ✓ Returns JWT Token                 │
    └────┬─────────────────────────────────┘
         │
         │ 2. POST /v1/projects (with JWT)
         │
    ┌────▼──────────────────────┐
    │  PROJECT CREATION         │
    │  ✓ Validates auth         │
    │  ✓ Creates project        │
    │  ✓ Status: DRAFT          │
    │  ✓ Returns Project ID     │
    └────┬──────────────────────┘
         │
         │ 3. POST /v1/projects/:id/upload (with ZIP)
         │
    ┌────▼──────────────────────────────────────┐
    │  FILE UPLOAD (202 Accepted)                │
    │  ✓ Validates auth & ownership             │
    │  ✓ Starts async processing                │
    │  ✓ Returns uploadId & status              │
    │  ✓ Processes in background                │
    └────┬──────────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────────────────────────┐
    │  BACKGROUND ZIP PROCESSING (Async)                         │
    │                                                             │
    │  Step 1: Extract ZIP → Temp Directory                     │
    │  Step 2: Read Directory Structure                         │
    │  Step 3: For each item:                                   │
    │          - If FOLDER → Create ProjectItem (is_folder=true)│
    │          - If FILE → Upload to B2 → Create ProjectItem   │
    │  Step 4: Update Project Status (READY/FAILED)            │
    │  Step 5: Cleanup Temp Files                              │
    └────┬──────────────────────────────────────────────────────┘
         │
         │ 4. GET /v1/projects/:id/upload-status (poll)
         │
    ┌────▼────────────────────────────┐
    │  PROGRESS TRACKING              │
    │  ✓ Returns upload status        │
    │  ✓ Progress %                   │
    │  ✓ Files processed count        │
    │  ✓ Folders created count        │
    └────┬────────────────────────────┘
         │
         │ 5. GET /v1/projects/:id/tree
         │
    ┌────▼────────────────────────────┐
    │  FILE TREE DISPLAY              │
    │  ✓ Returns hierarchical tree    │
    │  ✓ With B2 download URLs        │
    │  ✓ Full file metadata           │
    └─────────────────────────────────┘
```

---

## 🔄 PHASE 1: PROJECT CREATION

### Endpoint
```
POST /v1/projects
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Flow

```typescript
// 1. Frontend sends
{
  "name": "My Project",
  "description": "Project description",
  "visibility": "PRIVATE",
  "is_password_protected": false,
  "password": null
}

// 2. Controller receives request
@Post()
@UseGuards(JwtAuthGuard)  // ← Validates JWT
async create(
  @Body() createProjectDto: CreateProjectDto,
  @Request() req: any
)

// 3. Extracts user from validated JWT
req.user.id  // ← Authenticated user ID

// 4. Calls service with user ID
projectsService.create(createProjectDto, req.user.id)
```

### Service Processing

```typescript
async create(
  createProjectDto: CreateProjectDto,
  userId: string
): Promise<ProjectResponseDto> {
  
  // Step 1: Generate slug from project name
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
  
  // Step 2: Create project entity
  const project = projectsRepository.create({
    name,                      // "My Project"
    description,              // "Project description"
    slug,                      // "my-project"
    owner_id: userId,         // ← User who created it
    visibility,               // "PRIVATE"
    status: DRAFT,            // ← Initial status
    is_password_protected,    // false
    password_hash,            // null
    member_count: 1,          // Only owner initially
    item_count: 0,            // No files yet
    storage_used: 0,          // No storage yet
  });
  
  // Step 3: Save to database
  const savedProject = await projectsRepository.save(project);
  
  // Step 4: Format and return response
  return formatProjectResponse(savedProject);
}
```

### Database Changes

```sql
INSERT INTO projects (
  id, owner_id, name, description, slug, 
  status, visibility, is_password_protected, 
  password_hash, member_count, item_count, 
  storage_used, created_at, updated_at
) VALUES (
  'uuid-123',           -- Generated UUID
  'user-456',           -- Owner ID (from JWT)
  'My Project',         -- Project name
  'Description...',     -- Description
  'my-project',         -- Auto-generated slug
  'DRAFT',             -- Status
  'PRIVATE',           -- Visibility
  false,               -- No password
  NULL,                -- No hash
  1,                   -- Owner count
  0,                   -- No files yet
  0,                   -- No storage yet
  NOW(),               -- Timestamp
  NOW()                -- Timestamp
)

-- Project created with ID: uuid-123
```

### Response

```json
{
  "id": "uuid-123",
  "owner_id": "user-456",
  "name": "My Project",
  "slug": "my-project",
  "description": "Description...",
  "status": "DRAFT",
  "visibility": "PRIVATE",
  "member_count": 1,
  "item_count": 0,
  "storage_used": 0,
  "created_at": "2025-11-13T10:00:00Z",
  "updated_at": "2025-11-13T10:00:00Z"
}
```

### Status: `DRAFT` (Not Active)

---

## 📤 PHASE 2: FILE UPLOAD (ZIP)

### Endpoint
```
POST /v1/projects/:id/upload
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

Form Data:
- file: <zip-file>  (binary)
```

### Request Flow

```typescript
// 1. Frontend sends ZIP file
const formData = new FormData();
formData.append('file', zipFile);

fetch('POST /v1/projects/uuid-123/upload', {
  headers: { 'Authorization': 'Bearer ' + token },
  body: formData
})

// 2. Controller receives
@Post(':id/upload')
@UseGuards(JwtAuthGuard)           // ← Validates JWT
@UseInterceptors(FileInterceptor('file'))  // ← Extracts file
async uploadProjectFiles(
  @Param('id') projectId: string,
  @UploadedFile() file: any,
  @Request() req: any
)

// 3. File object contains:
{
  fieldname: 'file',
  originalname: 'project.zip',
  encoding: '7bit',
  mimetype: 'application/zip',
  size: 5242880,                    // 5MB
  buffer: <Buffer>,                 // Binary data
  destination: '/tmp',
  filename: 'project.zip'
}

// 4. Calls service
projectsService.uploadProjectFiles(projectId, req.user.id, file)
```

### Service: uploadProjectFiles()

```typescript
async uploadProjectFiles(
  projectId: string,
  userId: string,
  zipFile: any
): Promise<{ message: string; uploadId: string }> {
  
  // Step 1: Verify project exists
  const project = await projectsRepository.findOne({ where: { id: projectId } });
  if (!project) throw new NotFoundException('Project not found');
  
  // Step 2: Verify user is owner
  if (project.owner_id !== userId) {
    throw new ForbiddenException('Only project owner can upload');
  }
  
  // Step 3: Check project status
  if (project.status === ARCHIVED) {
    throw new BadRequestException('Cannot upload to archived project');
  }
  
  // Step 4: Initialize progress tracking
  const uploadProgress = {
    projectId,
    status: 'PENDING',           // Starting state
    progress: 0,                 // 0% complete
    filesProcessed: 0,           // 0 files
    totalFiles: 0,               // Will be counted
    foldersCreated: 0,           // 0 folders
    startedAt: new Date(),
  };
  
  // Step 5: Store in memory Map for polling
  this.uploadProgress.set(projectId, uploadProgress);
  
  // Step 6: Start background processing (async, non-blocking)
  this.processProjectUpload(projectId, userId, zipFile, uploadProgress);
  
  // Step 7: Return immediately with 202 Accepted
  return {
    message: 'Upload started. Processing in background.',
    uploadId: projectId
  };
}
```

### Response (202 Accepted)

```json
{
  "message": "Upload started. Processing in background.",
  "uploadId": "uuid-123"
}
```

**Important**: This returns IMMEDIATELY while the upload processes asynchronously!

---

## ⚙️ PHASE 3: BACKGROUND ZIP PROCESSING

### Service: processProjectUpload()

This runs ASYNCHRONOUSLY in the background while the HTTP response is sent.

```typescript
private async processProjectUpload(
  projectId: string,
  userId: string,
  zipFile: any,
  uploadProgress: UploadProgress
): Promise<void> {
  try {
    // Update status to PROCESSING
    uploadProgress.status = 'PROCESSING';
    
    // ============ STEP 1: EXTRACT ZIP FILE ============
    // TODO: Implement with archiver or unzipper library
    // For now, placeholder implementation
    const extractedPath = await this.extractZipFile(zipFile);
    // Result: /tmp/project-1699868400000/
    
    // ============ STEP 2: BUILD TREE & UPLOAD FILES ============
    await this.buildTreeAndUploadFiles(
      projectId,           // uuid-123
      extractedPath,       // /tmp/project-1699868400000/
      null,                // parentId (null = root level)
      uploadProgress       // Progress tracker
    );
    
    // ============ STEP 3: UPDATE PROJECT STATUS ============
    const project = await projectsRepository.findOne({ where: { id: projectId } });
    if (project) {
      project.status = ProjectStatus.READY;     // ← Now active
      project.item_count = uploadProgress.filesProcessed + uploadProgress.foldersCreated;
      project.storage_used = /* sum of all file sizes */;
      await projectsRepository.save(project);
    }
    
    // ============ STEP 4: MARK UPLOAD COMPLETE ============
    uploadProgress.status = 'COMPLETED';
    uploadProgress.completedAt = new Date();
    
    // ============ STEP 5: CLEANUP TEMP FILES ============
    fs.rmSync(extractedPath, { recursive: true, force: true });
    
  } catch (error) {
    // Error handling
    uploadProgress.status = 'FAILED';
    uploadProgress.error = error.message;
    uploadProgress.completedAt = new Date();
    
    // Update project status to FAILED
    const project = await projectsRepository.findOne({ where: { id: projectId } });
    if (project) {
      project.status = ProjectStatus.FAILED;
      project.metadata = {
        uploadError: error.message,
        failedAt: new Date()
      };
      await projectsRepository.save(project);
    }
  }
}
```

---

## 🌳 PHASE 4: BUILD FILE TREE & UPLOAD TO B2

### Service: buildTreeAndUploadFiles()

This method processes the extracted ZIP recursively:

```typescript
private async buildTreeAndUploadFiles(
  projectId: string,
  basePath: string,              // /tmp/project-xxx/
  parentId: string | null,       // null or folder UUID
  uploadProgress: UploadProgress
): Promise<void> {
  
  // Read all entries in current directory
  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  // Result: [
  //   { name: 'folder1', isDirectory: true },
  //   { name: 'file1.txt', isDirectory: false },
  //   { name: 'file2.pdf', isDirectory: false }
  // ]
  
  for (const entry of entries) {
    const fullPath = path.join(basePath, entry.name);
    const relativePath = path.relative(basePath, fullPath);
    
    if (entry.isDirectory()) {
      // ========== CREATE FOLDER NODE ==========
      const folderItem = new ProjectItem();
      folderItem.project_id = projectId;           // uuid-123
      folderItem.parent_id = parentId;             // null or parent folder ID
      folderItem.name = entry.name;                // "folder1"
      folderItem.is_folder = true;                 // ← Folder flag
      folderItem.path = relativePath;              // "folder1"
      folderItem.file_type = 'FOLDER';
      folderItem.size = 0;                         // Folders have 0 size
      folderItem.order = uploadProgress.foldersCreated;
      
      // Save to database
      const savedFolder = await projectItemsRepository.save(folderItem);
      uploadProgress.foldersCreated++;
      
      // Database insert:
      // INSERT INTO project_items (
      //   id, project_id, parent_id, name, is_folder, path, ...
      // ) VALUES (
      //   'uuid-folder-1', 'uuid-123', NULL, 'folder1', true, 'folder1', ...
      // )
      
      // ========== RECURSE INTO SUBDIRECTORY ==========
      // Process files/folders inside this folder
      await this.buildTreeAndUploadFiles(
        projectId,
        fullPath,              // /tmp/project-xxx/folder1/
        savedFolder.id,        // uuid-folder-1 (parent for children)
        uploadProgress
      );
      
    } else {
      // ========== UPLOAD FILE TO B2 ==========
      const fileBuffer = fs.readFileSync(fullPath);
      // Result: <Buffer> of file contents
      
      const uploadResult = await storageService.uploadFile(
        { 
          buffer: fileBuffer,
          originalname: entry.name 
        },
        projectId,
        parentId ? `${parentId}/` : ''
      );
      
      // Upload result contains:
      // {
      //   fileId: 'b2-file-123',
      //   url: 'https://s3.us-east-005.backblazeb2.com/.../file1.txt',
      //   uploadTimestamp: 1699868400000
      // }
      
      // ========== CREATE FILE NODE IN DATABASE ==========
      const fileItem = new ProjectItem();
      fileItem.project_id = projectId;              // uuid-123
      fileItem.parent_id = parentId;                // uuid-folder-1 or null
      fileItem.name = entry.name;                   // "file1.txt"
      fileItem.is_folder = false;                   // ← File flag
      fileItem.path = relativePath;                 // "folder1/file1.txt"
      fileItem.file_type = this.detectFileType(entry.name);  // 'DOCUMENT'
      fileItem.mime_type = this.getMimeType(entry.name);     // 'text/plain'
      fileItem.size = fileBuffer.length;            // 1024 bytes
      fileItem.order = uploadProgress.filesProcessed;
      fileItem.b2_file_id = uploadResult.fileId;    // 'b2-file-123'
      fileItem.b2_url = uploadResult.url;           // B2 download URL
      fileItem.checksum = this.calculateChecksum(fileBuffer);  // SHA256
      
      // Save to database
      await projectItemsRepository.save(fileItem);
      uploadProgress.filesProcessed++;
      
      // Database insert:
      // INSERT INTO project_items (
      //   id, project_id, parent_id, name, is_folder, path,
      //   file_type, mime_type, size, b2_file_id, b2_url, checksum, ...
      // ) VALUES (
      //   'uuid-file-1', 'uuid-123', 'uuid-folder-1', 'file1.txt',
      //   false, 'folder1/file1.txt', 'DOCUMENT', 'text/plain',
      //   1024, 'b2-file-123', 'https://...', 'sha256hash', ...
      // )
      
      // ========== UPDATE PROJECT STORAGE ==========
      project.storage_used += fileBuffer.length;
    }
    
    // ========== UPDATE PROGRESS ==========
    uploadProgress.progress = Math.round(
      ((uploadProgress.filesProcessed + uploadProgress.foldersCreated) / 
       entries.length) * 100
    );
  }
  
  // Save updated project
  await projectsRepository.save(project);
}
```

### Example ZIP Structure Processing

```
project.zip
├── documents/
│   ├── readme.txt         (100 KB)
│   └── guide.pdf          (500 KB)
├── images/
│   ├── photo1.jpg         (2 MB)
│   └── photo2.jpg         (1.5 MB)
├── index.html             (50 KB)
└── style.css              (20 KB)
```

**Processing Steps:**

1. **Extract ZIP** → `/tmp/project-1699868400000/`

2. **Process root level:**
   - Folder: `documents` → Create ProjectItem (parent_id=NULL)
   - Folder: `images` → Create ProjectItem (parent_id=NULL)
   - File: `index.html` → Upload to B2 + Create ProjectItem (parent_id=NULL)
   - File: `style.css` → Upload to B2 + Create ProjectItem (parent_id=NULL)

3. **Process documents/ folder:**
   - File: `readme.txt` → Upload to B2 + Create ProjectItem (parent_id=documents_id)
   - File: `guide.pdf` → Upload to B2 + Create ProjectItem (parent_id=documents_id)

4. **Process images/ folder:**
   - File: `photo1.jpg` → Upload to B2 + Create ProjectItem (parent_id=images_id)
   - File: `photo2.jpg` → Upload to B2 + Create ProjectItem (parent_id=images_id)

5. **Cleanup:** Delete `/tmp/project-1699868400000/`

6. **Final Status:** Project status = `READY`, item_count = 6, storage_used = 4,170 KB

---

## 📊 PHASE 5: PROGRESS TRACKING

### Endpoint
```
GET /v1/projects/:id/upload-status
Authorization: Bearer <JWT_TOKEN>
```

### Service: getUploadStatus()

```typescript
async getUploadStatus(projectId: string): Promise<UploadStatusDto> {
  const progress = this.uploadProgress.get(projectId);
  
  if (!progress) {
    throw new NotFoundException('Upload not found');
  }
  
  return {
    projectId,
    status: progress.status,              // 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    progress: progress.progress,          // 0-100%
    filesProcessed: progress.filesProcessed,    // Current count
    totalFiles: progress.totalFiles,      // Total count
    foldersCreated: progress.foldersCreated,    // Count
    error: progress.error,                // Error message if failed
    startedAt: progress.startedAt,        // ISO timestamp
    completedAt: progress.completedAt,    // ISO timestamp or null
  };
}
```

### Response Examples

**During Upload (PROCESSING):**
```json
{
  "projectId": "uuid-123",
  "status": "PROCESSING",
  "progress": 65,
  "filesProcessed": 13,
  "totalFiles": 20,
  "foldersCreated": 5,
  "startedAt": "2025-11-13T10:05:00Z",
  "completedAt": null
}
```

**Completed:**
```json
{
  "projectId": "uuid-123",
  "status": "COMPLETED",
  "progress": 100,
  "filesProcessed": 20,
  "totalFiles": 20,
  "foldersCreated": 5,
  "startedAt": "2025-11-13T10:05:00Z",
  "completedAt": "2025-11-13T10:15:00Z"
}
```

**Failed:**
```json
{
  "projectId": "uuid-123",
  "status": "FAILED",
  "progress": 25,
  "filesProcessed": 5,
  "totalFiles": 20,
  "foldersCreated": 1,
  "error": "ZIP extraction failed: corrupted archive",
  "startedAt": "2025-11-13T10:05:00Z",
  "completedAt": "2025-11-13T10:06:00Z"
}
```

---

## 🌲 PHASE 6: GET FILE TREE

### Endpoint
```
GET /v1/projects/:id/tree
Authorization: Bearer <JWT_TOKEN> (optional)
Query Params:
  - depth: number (default: 10)
```

### Service: getProjectTree()

```typescript
async getProjectTree(
  projectId: string,
  depth: number = 10
): Promise<ProjectTreeResponseDto> {
  
  const project = await projectsRepository.findOne({ where: { id: projectId } });
  
  if (!project) {
    throw new NotFoundException('Project not found');
  }
  
  // Get root items (parent_id = NULL)
  const rootItems = await projectItemsRepository.find({
    where: {
      project_id: projectId,
      parent_id: IsNull()
    },
    order: { order: 'ASC' }
  });
  
  // Build hierarchical tree
  const tree: ProjectTreeNodeDto[] = [];
  for (const item of rootItems) {
    const node = await this.buildTreeNode(item, depth - 1);
    tree.push(node);
  }
  
  return {
    projectId,
    projectName: project.name,
    status: project.status,
    tree,
    totalItems: project.item_count,
    totalSize: project.storage_used
  };
}
```

### Service: buildTreeNode() (Recursive)

```typescript
private async buildTreeNode(
  item: ProjectItem,
  remainingDepth: number
): Promise<ProjectTreeNodeDto> {
  
  const node: ProjectTreeNodeDto = {
    id: item.id,
    name: item.name,
    type: item.is_folder ? 'folder' : item.file_type,
    size: item.size,
    path: item.path,
    created_at: item.created_at,
    updated_at: item.updated_at,
    children: [],
  };
  
  // If it's a folder and we have depth remaining, load children
  if (item.is_folder && remainingDepth > 0) {
    const children = await projectItemsRepository.find({
      where: { parent_id: item.id },
      order: { order: 'ASC' }
    });
    
    // Recursively build child nodes
    for (const child of children) {
      const childNode = await this.buildTreeNode(child, remainingDepth - 1);
      node.children.push(childNode);
    }
  }
  
  // If it's a file, add download URL
  if (!item.is_folder) {
    node.downloadUrl = item.b2_url;
    node.mimeType = item.mime_type;
    node.checksum = item.checksum;
  }
  
  return node;
}
```

### Response

```json
{
  "projectId": "uuid-123",
  "projectName": "My Project",
  "status": "READY",
  "tree": [
    {
      "id": "uuid-folder-1",
      "name": "documents",
      "type": "folder",
      "size": 0,
      "path": "documents",
      "created_at": "2025-11-13T10:06:00Z",
      "updated_at": "2025-11-13T10:06:00Z",
      "children": [
        {
          "id": "uuid-file-1",
          "name": "readme.txt",
          "type": "DOCUMENT",
          "size": 102400,
          "path": "documents/readme.txt",
          "downloadUrl": "https://s3.us-east-005.backblazeb2.com/.../readme.txt",
          "mimeType": "text/plain",
          "checksum": "sha256abc123...",
          "created_at": "2025-11-13T10:06:10Z",
          "updated_at": "2025-11-13T10:06:10Z",
          "children": []
        },
        {
          "id": "uuid-file-2",
          "name": "guide.pdf",
          "type": "DOCUMENT",
          "size": 512000,
          "path": "documents/guide.pdf",
          "downloadUrl": "https://s3.us-east-005.backblazeb2.com/.../guide.pdf",
          "mimeType": "application/pdf",
          "checksum": "sha256def456...",
          "created_at": "2025-11-13T10:06:15Z",
          "updated_at": "2025-11-13T10:06:15Z",
          "children": []
        }
      ]
    },
    {
      "id": "uuid-folder-2",
      "name": "images",
      "type": "folder",
      "size": 0,
      "path": "images",
      "created_at": "2025-11-13T10:06:00Z",
      "updated_at": "2025-11-13T10:06:00Z",
      "children": [
        {
          "id": "uuid-file-3",
          "name": "photo1.jpg",
          "type": "IMAGE",
          "size": 2097152,
          "path": "images/photo1.jpg",
          "downloadUrl": "https://s3.us-east-005.backblazeb2.com/.../photo1.jpg",
          "mimeType": "image/jpeg",
          "checksum": "sha256ghi789...",
          "children": []
        }
      ]
    },
    {
      "id": "uuid-file-4",
      "name": "index.html",
      "type": "CODE",
      "size": 51200,
      "path": "index.html",
      "downloadUrl": "https://s3.us-east-005.backblazeb2.com/.../index.html",
      "mimeType": "text/html",
      "checksum": "sha256jkl012...",
      "children": []
    }
  ],
  "totalItems": 6,
  "totalSize": 4170752
}
```

---

## 🗄️ DATABASE SCHEMA

### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'DRAFT',          -- DRAFT, READY, PUBLISHED, FAILED, ACTIVE, ARCHIVED
  visibility VARCHAR(50) DEFAULT 'PRIVATE',   -- PUBLIC, PRIVATE, INTERNAL
  is_password_protected BOOLEAN DEFAULT false,
  password_hash VARCHAR(255),
  member_count INTEGER DEFAULT 0,
  item_count INTEGER DEFAULT 0,               -- Total files + folders
  storage_used BIGINT DEFAULT 0,              -- Total bytes
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### ProjectItems Table (Hierarchical)
```sql
CREATE TABLE project_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES project_items(id) ON DELETE CASCADE,  -- NULL = root
  name VARCHAR(255) NOT NULL,
  is_folder BOOLEAN DEFAULT false,
  path TEXT NOT NULL,                         -- Relative path in project
  file_type VARCHAR(50),                      -- FOLDER, DOCUMENT, IMAGE, CODE, etc
  mime_type VARCHAR(255),
  size BIGINT DEFAULT 0,
  b2_file_id VARCHAR(255),                    -- B2 identifier
  b2_url TEXT,                                -- Download URL
  checksum VARCHAR(255),                      -- SHA256
  mpath MATERIALIZED_PATH,                    -- Tree support
  order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_folder_size CHECK (is_folder OR size > 0)
);

CREATE INDEX idx_project_items_project_id ON project_items(project_id);
CREATE INDEX idx_project_items_parent_id ON project_items(parent_id);
CREATE INDEX idx_project_items_project_parent ON project_items(project_id, parent_id);
```

---

## 🔐 Authentication Flow

### JWT Token Process

```typescript
// 1. User logs in
POST /v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// 2. Backend validates & returns JWT
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "user": { id: "user-456", email: "...", ... }
}

// 3. Frontend stores token
localStorage.setItem('access_token', token);

// 4. Frontend sends with requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 5. Backend validates with JwtAuthGuard
@UseGuards(JwtAuthGuard)
async create(@Request() req) {
  const userId = req.user.id;  // Extracted from JWT
  // Use userId for ownership checks
}
```

---

## ✅ Status Transitions

### Project Status Flow

```
CREATE PROJECT
    ↓
status: DRAFT
    ↓
[Upload Files]
    ↓
status: READY (if successful)
    or
status: FAILED (if error)
    ↓
[Publish]
    ↓
status: ACTIVE (publicly visible)
    ↓
[Archive]
    ↓
status: ARCHIVED (no uploads allowed)
```

---

## 🔍 Key Validations

| Operation | Validation |
|-----------|-----------|
| Create Project | User must be authenticated (JWT) |
| Upload Files | User must be owner + project not archived |
| View Tree | Public if visibility=PUBLIC, otherwise owner only |
| Update Project | User must be owner |
| Publish Project | User must be owner |
| Delete Project | User must be owner |

---

## 📈 Performance Considerations

| Component | Optimization |
|-----------|-------------|
| **ZIP Extraction** | Async, background processing (202 response) |
| **File Upload** | Parallel B2 uploads (can be optimized) |
| **Tree Building** | Recursive with depth limit (default: 10 levels) |
| **Progress Tracking** | In-memory Map (fast queries) |
| **Database Indexes** | Composite index on (project_id, parent_id) |
| **File Storage** | Backblaze B2 (S3-compatible, cost-effective) |

---

## 🚀 Complete Request-Response Cycle

### Full Example Flow

```
1. USER AUTHENTICATION
POST /v1/auth/login
← 200 OK: JWT Token

2. CREATE PROJECT
POST /v1/projects
Authorization: Bearer <TOKEN>
Body: { name: "My Project", ... }
← 201 CREATED: Project ID = "uuid-123"

3. UPLOAD FILES
POST /v1/projects/uuid-123/upload
Authorization: Bearer <TOKEN>
Form Data: file: <project.zip>
← 202 ACCEPTED: Upload in background

4. POLL STATUS (while uploading)
GET /v1/projects/uuid-123/upload-status
Authorization: Bearer <TOKEN>
← 200 OK: Progress 45%, 9/20 files...

5. GET FILE TREE
GET /v1/projects/uuid-123/tree
Authorization: Bearer <TOKEN>
← 200 OK: Hierarchical tree with B2 URLs

6. DOWNLOAD FILE
GET <b2_url from tree>
← 200 OK: File download from B2

7. PUBLISH PROJECT
POST /v1/projects/uuid-123/publish
Authorization: Bearer <TOKEN>
← 200 OK: Project now visible to others
```

---

## 📝 Summary

| Phase | Endpoint | Method | Returns | Status |
|-------|----------|--------|---------|--------|
| 1. Create | `/projects` | POST | Project ID | 201 |
| 2. Upload | `/projects/:id/upload` | POST | Upload ID | 202 |
| 3. Process | *(background)* | - | - | - |
| 4. Status | `/projects/:id/upload-status` | GET | Progress | 200 |
| 5. Tree | `/projects/:id/tree` | GET | File tree | 200 |
| 6. Download | B2 URL | GET | File content | 200 |

---

**Generated**: November 13, 2025  
**Status**: ✅ Complete  
**Backend Version**: NestJS 11.1.0  
**Database**: PostgreSQL (Neon)  
**Storage**: Backblaze B2 (S3-compatible)
