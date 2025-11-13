# M-Share Project Creation & Upload Flow Guide

**Document Version:** 1.0  
**Last Updated:** November 2024  
**Status:** Aligned with Backend Architecture

---

## Table of Contents

1. [Overview](#overview)
2. [User Flow](#user-flow)
3. [Technical Architecture](#technical-architecture)
4. [API Endpoints](#api-endpoints)
5. [Frontend Implementation](#frontend-implementation)
6. [File Structure & Database](#file-structure--database)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)
9. [Performance Optimization](#performance-optimization)
10. [Examples & Code Samples](#examples--code-samples)

---

## Overview

### Purpose

M-Share allows users to create projects and upload their entire codebase (as a folder or ZIP file). The system:

1. **Accepts uploads** as ZIP files or folder drag-and-drop
2. **Extracts and processes** on the NestJS backend
3. **Builds folder tree** in PostgreSQL database
4. **Uploads files** to Backblaze B2 cloud storage
5. **Creates node entries** for every folder/file
6. **Renders GitHub-like explorer** on the frontend
7. **Provides file viewing** without direct downloads

### Key Features

✅ **Folder/ZIP upload** - Drag and drop entire projects  
✅ **Recursive extraction** - Automatically processes nested directories  
✅ **Database indexing** - Fast tree traversal and search  
✅ **Cloud storage** - Files stored on Backblaze B2  
✅ **GitHub-style explorer** - Browse files like GitHub  
✅ **Access control** - Public/Private/Password-protected projects  
✅ **Activity tracking** - Log all upload and file operations  
✅ **No direct downloads** - View files only through API

---

## User Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER INITIATES PROJECT CREATION                                 │
│    - Clicks "New Project" button                                    │
│    - Opens "Add Project" dialog/modal                               │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. ENTER PROJECT DETAILS                                            │
│    - Project Name (required)                                        │
│    - Description (optional)                                         │
│    - Visibility: Private/Public                                     │
│    - Password Protection (optional)                                 │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. UPLOAD PROJECT FILES                                             │
│    Option A: Drag & drop folder/ZIP                                 │
│    Option B: Click to select file/folder                            │
│    - System accepts folders and ZIP files                           │
│    - Shows uploading progress                                       │
│    - Validates file size (max 100MB)                                │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. FRONTEND PROCESSING                                              │
│    - Compresses folder to ZIP (if needed)                           │
│    - Validates ZIP integrity                                        │
│    - Shows file preview (tree structure)                            │
│    - Displays upload size and file count                            │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. SUBMIT & CREATE PROJECT                                          │
│    - Sends project metadata to backend                              │
│    - Creates project record (status: DRAFT)                         │
│    - Receives project ID                                            │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. UPLOAD TO BACKEND                                                │
│    - Sends ZIP file via multipart/form-data                         │
│    - Backend receives and stores temporarily                        │
│    - Returns upload confirmation                                    │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. BACKEND PROCESSING (NestJS)                                      │
│    - Extracts ZIP file                                              │
│    - Builds folder tree structure                                   │
│    - Uploads each file to Backblaze B2                              │
│    - Creates database nodes                                         │
│    - Logs activities                                                │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. FRONTEND FETCHES TREE                                            │
│    - Polls backend for completion status                            │
│    - Receives folder/file tree                                      │
│    - Renders GitHub-style explorer                                  │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 9. USER VIEWS PROJECT                                               │
│    - Explores files and folders                                     │
│    - Views file content (from API)                                  │
│    - Cannot directly download (controlled access)                   │
│    - Can publish or archive project                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Component Interaction

```
FRONTEND                              BACKEND (NestJS)         STORAGE
─────────────────────────────────────────────────────────────────────

AddProject.tsx
    │
    ├─► Form Collection
    │   ├─ Project metadata
    │   └─ ZIP file
    │
    └─► projectService
        │
        ├─► POST /projects (Create)
        │   └─► Returns: { projectId, uploadUrl }
        │
        ├─► POST /projects/:id/upload (Upload ZIP)
        │   │
        │   └─► Backend:
        │       ├─ Extract ZIP
        │       ├─ Build tree
        │       ├─ Upload to B2
        │       └─ Create nodes
        │
        └─► GET /projects/:id/tree (Fetch tree)
            └─► Renders explorer

FileExplorer.tsx
    │
    ├─► Display tree
    ├─► Expand folders
    └─► View file content (GET /projects/:id/files/:fileId)
```

### Database Schema (Relevant Entities)

```sql
-- Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE,
  status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED'),
  visibility ENUM('PUBLIC', 'PRIVATE'),
  is_password_protected BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  item_count INT DEFAULT 0,
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Nodes Table (File Tree)
CREATE TABLE nodes (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  parent_id UUID,
  name VARCHAR(255) NOT NULL,
  type ENUM('FILE', 'FOLDER'),
  mime_type VARCHAR(100),
  size BIGINT DEFAULT 0,
  path VARCHAR(2048),
  b2_file_id VARCHAR(255),
  b2_url VARCHAR(2048),
  checksum VARCHAR(64),
  order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE,
  INDEX idx_project_parent (project_id, parent_id)
);

-- Activities Table
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  type VARCHAR(100),
  action VARCHAR(255),
  description TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

---

## API Endpoints

### 1. Create Project

**Endpoint:** `POST /v1/projects`

**Authentication:** JWT Required

**Request:**
```json
{
  "name": "My Awesome Codebase",
  "description": "A complete React + Node.js project",
  "visibility": "PRIVATE",
  "is_password_protected": false,
  "password": null
}
```

**Response:** `201 Created`
```json
{
  "id": "proj-abc123xyz",
  "name": "My Awesome Codebase",
  "description": "A complete React + Node.js project",
  "slug": "my-awesome-codebase",
  "owner_id": "user-123",
  "status": "DRAFT",
  "visibility": "PRIVATE",
  "is_password_protected": false,
  "member_count": 1,
  "item_count": 0,
  "storage_used": 0,
  "created_at": "2024-11-13T10:00:00Z",
  "updated_at": "2024-11-13T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `409 Conflict` - Project name already exists
- `422 Unprocessable Entity` - Invalid data

---

### 2. Upload Project Files (ZIP)

**Endpoint:** `POST /v1/projects/:projectId/upload`

**Authentication:** JWT Required

**Content-Type:** `multipart/form-data`

**Request:**
```
Headers:
  Content-Type: multipart/form-data
  Authorization: Bearer <JWT_TOKEN>

Body:
  file: <ZIP_BINARY>
  metadata: {
    "totalFiles": 145,
    "totalSize": 5242880,
    "fileStructure": {...}
  }
```

**Response:** `200 OK`
```json
{
  "projectId": "proj-abc123xyz",
  "uploadStatus": "PROCESSING",
  "message": "Upload received. Processing files...",
  "processId": "proc-123456",
  "estimatedTime": "30 seconds"
}
```

**Processing Steps (Backend):**
1. **Receive ZIP** - Temporarily store file
2. **Extract ZIP** - Decompress to temporary directory
3. **Build Tree** - Scan directory recursively
4. **Create Nodes** - Insert folder/file records in database
5. **Upload to B2** - Send files to Backblaze B2
6. **Update Status** - Mark project as READY

**Error Responses:**
- `400 Bad Request` - Invalid ZIP file
- `413 Payload Too Large` - File exceeds max size (100MB)
- `422 Unprocessable Entity` - Corrupted archive
- `429 Too Many Requests` - Rate limit exceeded

---

### 3. Get Upload Status

**Endpoint:** `GET /v1/projects/:projectId/upload-status`

**Authentication:** JWT Required

**Response:** `200 OK`
```json
{
  "projectId": "proj-abc123xyz",
  "status": "PROCESSING",
  "progress": 65,
  "processedFiles": 95,
  "totalFiles": 145,
  "currentFile": "src/components/Button.tsx",
  "startedAt": "2024-11-13T10:05:00Z",
  "estimatedCompletion": "2024-11-13T10:07:00Z"
}
```

**Status Values:**
- `PENDING` - Queued for processing
- `PROCESSING` - Currently extracting/uploading
- `COMPLETED` - All files processed successfully
- `FAILED` - Error during processing
- `CANCELLED` - User cancelled upload

---

### 4. Get Project File Tree

**Endpoint:** `GET /v1/projects/:projectId/tree`

**Authentication:** Not Required (respects visibility)

**Query Parameters:**
- `depth` (optional): Maximum nesting depth (default: unlimited)
- `filter` (optional): File type filter (e.g., "*.ts,*.tsx,*.js")

**Response:** `200 OK`
```json
{
  "projectId": "proj-abc123xyz",
  "tree": {
    "id": "node-root",
    "name": "project-root",
    "type": "FOLDER",
    "size": 5242880,
    "children": [
      {
        "id": "node-001",
        "name": "src",
        "type": "FOLDER",
        "size": 2097152,
        "children": [
          {
            "id": "node-002",
            "name": "index.ts",
            "type": "FILE",
            "mime_type": "text/typescript",
            "size": 2048,
            "b2_url": "https://f123.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=...",
            "created_at": "2024-11-13T10:05:00Z"
          },
          {
            "id": "node-003",
            "name": "components",
            "type": "FOLDER",
            "size": 1048576,
            "children": [
              {
                "id": "node-004",
                "name": "Button.tsx",
                "type": "FILE",
                "mime_type": "text/typescript",
                "size": 4096
              }
            ]
          }
        ]
      },
      {
        "id": "node-100",
        "name": "package.json",
        "type": "FILE",
        "mime_type": "application/json",
        "size": 512
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
```

---

### 5. Get File Content

**Endpoint:** `GET /v1/projects/:projectId/files/:fileId/content`

**Authentication:** Not Required (respects project visibility)

**Response:** `200 OK`

**Content-Type:** Based on file type (text/plain, application/json, etc.)

```
// Raw file content returned (not base64)
// For binary files, returns appropriate content-type
```

**For Text Files:**
```json
{
  "id": "file-123",
  "projectId": "proj-abc123xyz",
  "name": "index.ts",
  "mime_type": "text/typescript",
  "size": 2048,
  "content": "import express from 'express';\n...",
  "encoding": "utf-8",
  "lines": 45,
  "lastModified": "2024-11-13T10:05:00Z"
}
```

**For Binary Files:**
```
[Binary data with appropriate headers]
```

---

### 6. List Folder Contents

**Endpoint:** `GET /v1/projects/:projectId/folders/:folderId/children`

**Authentication:** Not Required

**Query Parameters:**
- `sortBy` (optional): "name", "size", "modified" (default: "name")
- `order` (optional): "asc", "desc" (default: "asc")
- `limit` (optional): Items per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "folderId": "node-003",
  "name": "components",
  "parent": "node-001",
  "children": [
    {
      "id": "node-004",
      "name": "Button.tsx",
      "type": "FILE",
      "size": 4096,
      "mime_type": "text/typescript",
      "modified": "2024-11-13T10:05:00Z"
    },
    {
      "id": "node-005",
      "name": "Input.tsx",
      "type": "FILE",
      "size": 3072,
      "mime_type": "text/typescript",
      "modified": "2024-11-13T10:05:00Z"
    },
    {
      "id": "node-006",
      "name": "forms",
      "type": "FOLDER",
      "size": 8192,
      "modified": "2024-11-13T10:05:00Z"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 50,
    "offset": 0
  }
}
```

---

## Frontend Implementation

### AddProject Component Structure

```typescript
// app/dashboard/projects/AddProject.tsx

interface AddProjectProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onProjectCreated?: (projectData: ProjectData) => void;
}

interface FormData {
  name: string;
  description: string;
  visibility: "Public" | "Private";
  isPasswordProtected: boolean;
  password?: string;
}

interface UploadedItem {
  name: string;
  size: number;
  type: "file" | "folder";
  path: string;
  children?: UploadedItem[];
}

export default function AddProject(props: AddProjectProps) {
  // State management
  const [formData, setFormData] = useState<FormData>({...});
  const [uploadedItems, setUploadedItems] = useState<UploadedItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Handler functions
  const handleDragAndDrop = async (files: FileList) => {...};
  const handleFileSelect = async (files: FileList) => {...};
  const handleCreateProject = async (formData: FormData) => {...};
  const handleUploadFiles = async (projectId: string, zip: File) => {...};
  
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent>
        {/* Step 1: Project Details */}
        {!uploadedItems.length && (
          <div>
            <ProjectDetailsForm />
            <FileUploadZone />
          </div>
        )}
        
        {/* Step 2: Review & Submit */}
        {uploadedItems.length > 0 && (
          <div>
            <FilePreview items={uploadedItems} />
            <SubmitButton onClick={handleCreateProject} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### File Upload Handling

```typescript
// lib/fileUpload.ts

export async function processUploadedItems(
  items: DataTransferItemList
): Promise<UploadedItem[]> {
  const results: UploadedItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i].webkitGetAsEntry?.();
    if (item) {
      const result = await processEntry(item);
      results.push(result);
    }
  }

  return results;
}

async function processEntry(
  entry: FileSystemEntry
): Promise<UploadedItem> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve) => {
      (entry as FileSystemFileEntry).file(resolve);
    });
    
    return {
      name: entry.name,
      size: file.size,
      type: "file",
      path: entry.fullPath,
    };
  } else if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children: UploadedItem[] = [];

    const entries = await new Promise<FileSystemEntry[]>((resolve) => {
      reader.readEntries(resolve);
    });

    for (const childEntry of entries) {
      const child = await processEntry(childEntry);
      children.push(child);
    }

    return {
      name: entry.name,
      size: children.reduce((sum, child) => sum + child.size, 0),
      type: "folder",
      path: entry.fullPath,
      children,
    };
  }

  throw new Error(`Unknown entry type: ${entry}`);
}

// Convert folder structure to ZIP
export async function folderToZip(items: UploadedItem[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  async function addItemToZip(
    item: UploadedItem,
    folder: JSZip.Folder
  ): Promise<void> {
    if (item.type === "file") {
      // Add file to ZIP
      const file = await getFileFromEntry(item.path);
      if (file) {
        folder.file(item.name, file);
      }
    } else if (item.type === "folder" && item.children) {
      const subfolder = folder.folder(item.name);
      if (subfolder) {
        for (const child of item.children) {
          await addItemToZip(child, subfolder);
        }
      }
    }
  }

  for (const item of items) {
    await addItemToZip(item, zip);
  }

  return await zip.generateAsync({ type: "blob" });
}
```

### Project Creation Service

```typescript
// src/services/projectService.ts

export class ProjectService {
  /**
   * Create a new project
   */
  async createProject(data: {
    name: string;
    description: string;
    visibility: "PRIVATE" | "PUBLIC";
    is_password_protected: boolean;
    password?: string;
  }): Promise<ApiResponse> {
    return apiService.post(
      API_ENDPOINTS.PROJECTS.CREATE,
      data
    );
  }

  /**
   * Upload project files (ZIP)
   */
  async uploadProjectFiles(
    projectId: string,
    zipFile: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append("file", zipFile);

    return apiService.post(
      `${API_ENDPOINTS.PROJECTS.UPLOAD}`.replace(":id", projectId),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentComplete = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            onProgress(percentComplete);
          }
        },
      }
    );
  }

  /**
   * Get project file tree
   */
  async getProjectTree(projectId: string): Promise<ApiResponse> {
    return apiService.get(
      `${API_ENDPOINTS.PROJECTS.TREE}`.replace(":id", projectId)
    );
  }

  /**
   * Get file content
   */
  async getFileContent(
    projectId: string,
    fileId: string
  ): Promise<ApiResponse> {
    return apiService.get(
      `/projects/${projectId}/files/${fileId}/content`
    );
  }

  /**
   * Monitor upload status
   */
  async getUploadStatus(projectId: string): Promise<ApiResponse> {
    return apiService.get(
      `/projects/${projectId}/upload-status`
    );
  }
}

export default new ProjectService();
```

### File Explorer Component

```typescript
// components/projects/FileExplorer.tsx

interface FileExplorerProps {
  projectId: string;
  tree: TreeNode;
}

interface TreeNode {
  id: string;
  name: string;
  type: "FILE" | "FOLDER";
  mime_type?: string;
  size: number;
  children?: TreeNode[];
}

export default function FileExplorer({
  projectId,
  tree,
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [selectedFile, setSelectedFile] = useState<TreeNode | null>(null);
  const [fileContent, setFileContent] = useState<string>("");

  const handleToggleFolder = (nodeId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleSelectFile = async (node: TreeNode) => {
    if (node.type === "FILE") {
      setSelectedFile(node);
      const response = await projectService.getFileContent(projectId, node.id);
      if (response.success) {
        setFileContent(response.data.content);
      }
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* File Tree (Left Panel) */}
      <div className="w-64 border-r overflow-auto">
        <TreeNode
          node={tree}
          level={0}
          expanded={expandedFolders}
          onToggle={handleToggleFolder}
          onSelect={handleSelectFile}
        />
      </div>

      {/* File Content (Right Panel) */}
      <div className="flex-1 overflow-auto">
        {selectedFile ? (
          <FileViewer
            file={selectedFile}
            content={fileContent}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a file to view
          </div>
        )}
      </div>
    </div>
  );
}

interface TreeNodeProps {
  node: TreeNode;
  level: number;
  expanded: Set<string>;
  onToggle: (nodeId: string) => void;
  onSelect: (node: TreeNode) => void;
}

function TreeNode({
  node,
  level,
  expanded,
  onToggle,
  onSelect,
}: TreeNodeProps) {
  const isExpanded = expanded.has(node.id);

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (node.type === "FOLDER") {
            onToggle(node.id);
          } else {
            onSelect(node);
          }
        }}
      >
        {node.type === "FOLDER" && (
          <ChevronRight
            size={16}
            className={`transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        )}
        {node.type === "FOLDER" ? (
          <FolderIcon size={16} className="text-blue-500" />
        ) : (
          <FileIcon size={16} className="text-gray-500" />
        )}
        <span className="text-sm">{node.name}</span>
      </div>

      {node.type === "FOLDER" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## File Structure & Database

### File Storage Architecture

```
Backend Storage:
├── /tmp/uploads/
│   ├── proj-abc123xyz/
│   │   ├── project.zip (temporary)
│   │   └── extracted/
│   │       ├── src/
│   │       ├── public/
│   │       ├── package.json
│   │       └── ...
│   └── ...

Backblaze B2:
├── m-share-bucket/
│   ├── proj-abc123xyz/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   └── ...
│   │   ├── public/
│   │   ├── package.json
│   │   └── ...
│   └── ...

Database (PostgreSQL):
├── projects
│   └── proj-abc123xyz: { name, owner, status, ... }
├── nodes (file tree)
│   ├── node-root: { type: FOLDER, name: proj-root }
│   ├── node-001: { type: FOLDER, name: src, parent: node-root }
│   ├── node-002: { type: FILE, name: index.ts, parent: node-001 }
│   └── ...
└── activities
    └── { type: FILE_UPLOADED, project_id, ... }
```

### Node Structure

```json
{
  "id": "uuid",
  "project_id": "proj-abc123xyz",
  "parent_id": "parent-uuid-or-null",
  "name": "filename.ext",
  "type": "FILE|FOLDER",
  "mime_type": "application/json",
  "size": 1024,
  "path": "src/components/button.tsx",
  "b2_file_id": "b2_file_id_from_backblaze",
  "b2_url": "https://f123.backblazeb2.com/...",
  "checksum": "sha1_hash_of_file",
  "order": 1,
  "created_at": "2024-11-13T10:00:00Z",
  "updated_at": "2024-11-13T10:00:00Z"
}
```

---

## Error Handling

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Invalid ZIP | 422 | Corrupted/malformed file | Re-upload file |
| File Too Large | 413 | Exceeds 100MB limit | Compress or split |
| Unauthorized | 401 | No JWT token | Login again |
| Project Not Found | 404 | Invalid project ID | Check project ID |
| Quota Exceeded | 429 | Storage limit exceeded | Delete old projects |
| Permission Denied | 403 | Not project owner | Use correct account |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ZIP",
    "message": "The uploaded file is not a valid ZIP archive",
    "details": {
      "fileName": "project.zip",
      "fileSize": 1024,
      "reason": "Missing end of central directory record"
    }
  },
  "timestamp": "2024-11-13T10:00:00Z"
}
```

### Frontend Error Handling

```typescript
export async function handleProjectUpload(
  formData: FormData,
  zipFile: File
): Promise<void> {
  try {
    // Step 1: Create project
    const createResponse = await projectService.createProject({
      name: formData.name,
      description: formData.description,
      visibility: formData.visibility,
      is_password_protected: formData.isPasswordProtected,
      password: formData.password,
    });

    if (!createResponse.success) {
      throw new Error(
        createResponse.error?.message || "Failed to create project"
      );
    }

    const projectId = createResponse.data.id;

    // Step 2: Upload files
    const uploadResponse = await projectService.uploadProjectFiles(
      projectId,
      zipFile,
      (progress) => {
        updateUploadProgress(progress);
      }
    );

    if (!uploadResponse.success) {
      // Optionally delete project on upload failure
      await projectService.deleteProject(projectId);
      throw new Error(
        uploadResponse.error?.message || "Failed to upload files"
      );
    }

    // Step 3: Monitor processing
    let status = "PROCESSING";
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    while (status === "PROCESSING" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5s
      
      const statusResponse = await projectService.getUploadStatus(projectId);
      if (statusResponse.success) {
        status = statusResponse.data.status;
        updateProcessingProgress(statusResponse.data.progress);
      }
      attempts++;
    }

    if (status !== "COMPLETED") {
      throw new Error("Upload processing timeout or failed");
    }

    toast.success("Project uploaded successfully!");
    navigateTo(`/dashboard/projects/${projectId}`);
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(error.message || "Upload failed");
  }
}
```

---

## Security Considerations

### 1. Authentication & Authorization

✅ **All write operations** require JWT token  
✅ **Project visibility** respected on read operations  
✅ **Password-protected** projects require password in request  
✅ **Ownership verification** on project modification  

```typescript
// Backend middleware
@UseGuards(JwtAuthGuard)
@Post("projects")
createProject(@Req() req: Request, @Body() dto: CreateProjectDto) {
  // JWT validated
  // req.user.id is authenticated user
  return this.projectsService.create(req.user.id, dto);
}
```

### 2. File Validation

✅ **ZIP format validation** - Prevent arbitrary uploads  
✅ **File type checking** - Whitelist allowed MIME types  
✅ **Size limits** - 100MB max per project  
✅ **Path traversal prevention** - Sanitize extracted paths  

```typescript
// Validate ZIP
function validateZipFile(file: File): void {
  // Check magic bytes (PK signature)
  if (!isValidZipSignature(file)) {
    throw new Error("Invalid ZIP file");
  }

  // Check total size
  if (file.size > 100 * 1024 * 1024) {
    throw new Error("File exceeds maximum size");
  }

  // Check content during extraction
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  for (const [path] of Object.entries(contents.files)) {
    if (path.includes("..") || path.startsWith("/")) {
      throw new Error("Invalid file path detected");
    }
  }
}
```

### 3. Storage Security

✅ **Backblaze B2 encryption** - Files encrypted at rest  
✅ **HTTPS-only** access to files  
✅ **Signed URLs** for temporary access  
✅ **No direct downloads** - Controlled via API  

```typescript
// Generate signed URL (optional)
// Only if needed for authorized users
const signedUrl = await b2Client.getSignedUrl(
  fileName,
  expirationInSeconds: 3600 // 1 hour
);
```

### 4. Database Security

✅ **Parameterized queries** - Prevent SQL injection  
✅ **Transaction consistency** - Atomic operations  
✅ **Soft deletes** - Preserve data integrity  
✅ **Audit logging** - Track all modifications  

---

## Performance Optimization

### 1. ZIP Extraction

```typescript
// Backend: Extract in chunks to avoid memory issues
async function extractZip(
  zipBuffer: Buffer,
  projectId: string
): Promise<void> {
  const extractionDir = `/tmp/uploads/${projectId}/extracted`;
  
  // Use streaming for large files
  const pipeline = util.promisify(stream.pipeline);
  await pipeline(
    fs.createReadStream(zipPath),
    unzipper.Extract({ path: extractionDir })
  );
}
```

### 2. Tree Building

```typescript
// Backend: Batch insert nodes for performance
async function buildFileTree(
  projectId: string,
  basePath: string
): Promise<void> {
  const nodes = [];
  let parentMap = new Map<string, string>();

  // Recursively scan directory
  async function scan(dir: string, parentId: string | null): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const nodePath = path.relative(basePath, fullPath);

      const node = {
        id: uuidv4(),
        project_id: projectId,
        parent_id: parentId,
        name: entry.name,
        type: entry.isDirectory() ? "FOLDER" : "FILE",
        path: nodePath,
        // ... other fields
      };

      nodes.push(node);

      if (entry.isDirectory()) {
        await scan(fullPath, node.id);
      }
    }
  }

  // Batch insert (e.g., 1000 at a time)
  await scan(basePath, null);
  const batchSize = 1000;
  for (let i = 0; i < nodes.length; i += batchSize) {
    await db.nodes.createMany(nodes.slice(i, i + batchSize));
  }
}
```

### 3. Frontend Caching

```typescript
// Cache file tree to avoid repeated API calls
const fileTreeCache = new Map<string, TreeNode>();

export function getCachedTree(projectId: string): TreeNode | undefined {
  return fileTreeCache.get(projectId);
}

export function setCachedTree(projectId: string, tree: TreeNode): void {
  fileTreeCache.set(projectId, tree);
  
  // Invalidate after 10 minutes
  setTimeout(() => {
    fileTreeCache.delete(projectId);
  }, 10 * 60 * 1000);
}
```

### 4. Lazy Loading

```typescript
// Only load children when folder is expanded
async function loadFolderContents(folderId: string): Promise<TreeNode[]> {
  const response = await apiService.get(
    `/projects/${projectId}/folders/${folderId}/children`
  );
  return response.data.children;
}
```

---

## Examples & Code Samples

### Complete Upload Flow Example

```typescript
// Example: Complete project creation and upload

async function createAndUploadProject() {
  const formData = {
    name: "My React App",
    description: "Production React application",
    visibility: "PRIVATE" as const,
    isPasswordProtected: false,
  };

  const uploadedItems: UploadedItem[] = [
    {
      name: "my-app",
      type: "folder",
      size: 5242880,
      path: "/my-app",
      children: [
        {
          name: "src",
          type: "folder",
          size: 2097152,
          path: "/my-app/src",
          children: [
            {
              name: "index.tsx",
              type: "file",
              size: 2048,
              path: "/my-app/src/index.tsx",
            },
            {
              name: "App.tsx",
              type: "file",
              size: 4096,
              path: "/my-app/src/App.tsx",
            },
          ],
        },
        {
          name: "package.json",
          type: "file",
          size: 1024,
          path: "/my-app/package.json",
        },
      ],
    },
  ];

  try {
    // Step 1: Convert to ZIP
    const zipBlob = await folderToZip(uploadedItems);
    const zipFile = new File([zipBlob], "project.zip", {
      type: "application/zip",
    });

    // Step 2: Create project
    console.log("Creating project...");
    const createResp = await projectService.createProject(formData);

    if (!createResp.success) {
      throw new Error("Failed to create project");
    }

    const projectId = createResp.data.id;
    console.log(`Project created: ${projectId}`);

    // Step 3: Upload files
    console.log("Uploading files...");
    const uploadResp = await projectService.uploadProjectFiles(
      projectId,
      zipFile,
      (progress) => {
        console.log(`Upload progress: ${progress}%`);
      }
    );

    if (!uploadResp.success) {
      throw new Error("Failed to upload files");
    }

    console.log("Upload started, monitoring progress...");

    // Step 4: Poll status until complete
    let completed = false;
    let attempts = 0;

    while (!completed && attempts < 60) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const statusResp = await projectService.getUploadStatus(projectId);

      if (statusResp.success) {
        const { status, progress } = statusResp.data;
        console.log(`Status: ${status}, Progress: ${progress}%`);

        if (status === "COMPLETED") {
          completed = true;
        } else if (status === "FAILED") {
          throw new Error("Upload processing failed");
        }
      }

      attempts++;
    }

    if (!completed) {
      throw new Error("Upload timeout");
    }

    // Step 5: Fetch and display tree
    console.log("Fetching file tree...");
    const treeResp = await projectService.getProjectTree(projectId);

    if (treeResp.success) {
      console.log("File tree:", treeResp.data.tree);
      // Render file explorer
    }

    return projectId;
  } catch (error) {
    console.error("Error:", error);
    toast.error(error.message);
  }
}
```

### File Viewer Component

```typescript
// components/projects/FileViewer.tsx

interface FileViewerProps {
  file: TreeNode;
  content: string;
}

export function FileViewer({ file, content }: FileViewerProps) {
  const [copied, setCopied] = useState(false);
  const language = getLanguageFromMimeType(file.mime_type);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <FileIcon size={20} />
          <span className="font-medium">{file.name}</span>
          <span className="text-sm text-muted-foreground">
            ({formatBytes(file.size)})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isTextFile(file.mime_type) ? (
          <CodeBlock language={language} code={content} />
        ) : isImageFile(file.mime_type) ? (
          <img src={file.b2_url} alt={file.name} className="max-w-full" />
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Cannot preview {file.mime_type} files
          </div>
        )}
      </div>
    </div>
  );
}

function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  return (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
      <code className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
}
```

---

## Conclusion

This architecture provides:

1. ✅ **Seamless user experience** - Simple drag-and-drop upload
2. ✅ **Scalable backend** - Handles large projects efficiently
3. ✅ **GitHub-like interface** - Familiar file browser
4. ✅ **Secure storage** - Cloud-based with access control
5. ✅ **Activity tracking** - Audit trail for all operations
6. ✅ **Performance** - Lazy loading and caching

### Next Steps

- Implement progress monitoring with WebSockets
- Add file search and filtering capabilities
- Implement syntax highlighting for code files
- Add collaborative features (coming in team version)
- Performance testing with large projects (1GB+)

---

**Document Version:** 1.0  
**Last Updated:** November 2024  
**Status:** Ready for Implementation
