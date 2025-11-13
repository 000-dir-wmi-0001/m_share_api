// PROJECT_UPLOAD_API_TYPES.ts
// TypeScript types for M-Share Project Upload API

/**
 * Authentication
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    created_at: Date;
  };
}

/**
 * Project Management
 */
export interface CreateProjectRequest {
  name: string;
  description?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
  is_password_protected?: boolean;
  password?: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  slug: string;
  status: 'DRAFT' | 'READY' | 'PUBLISHED' | 'ARCHIVED' | 'FAILED' | 'ACTIVE' | 'DELETED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
  owner_id: string;
  member_count: number;
  item_count: number;
  storage_used: number;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * File Upload
 */
export interface UploadRequest {
  file: File; // ZIP file
}

export interface UploadStartResponse {
  message: string;
  uploadId: string;
}

export enum UploadStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface UploadStatusResponse {
  projectId: string;
  status: UploadStatus;
  progress: number; // 0-100
  filesProcessed: number;
  totalFiles: number;
  foldersCreated: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * File Tree
 */
export type FileType = 'FILE' | 'FOLDER';

export type MimeType = 
  | 'text/plain'
  | 'text/markdown'
  | 'text/html'
  | 'text/css'
  | 'text/javascript'
  | 'text/typescript'
  | 'application/json'
  | 'application/xml'
  | 'application/pdf'
  | 'application/zip'
  | 'image/png'
  | 'image/jpeg'
  | 'image/gif'
  | 'image/svg+xml'
  | 'image/webp'
  | 'video/mp4'
  | 'video/webm'
  | 'audio/mpeg'
  | 'audio/wav'
  | string;

export interface ProjectTreeNode {
  id: string;
  name: string;
  type: FileType;
  mime_type?: MimeType;
  size: number;
  path: string;
  b2_url?: string;
  order: number;
  created_at: Date;
  updated_at: Date;
  children?: ProjectTreeNode[];
}

export interface ProjectTreeResponse {
  projectId: string;
  projectName: string;
  root: ProjectTreeNode;
  itemCount: number;
  storageUsed: number; // bytes
}

export interface FolderChildrenResponse extends Array<ProjectTreeNode> {}

/**
 * File Operations
 */
export interface FileContentResponse {
  url: string; // B2 storage URL
  fileName: string;
}

/**
 * Error Responses
 */
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, any>;
}

/**
 * API Client Configuration
 */
export interface ApiClientConfig {
  baseUrl: string;
  token?: string;
  timeout?: number;
}

/**
 * API Service Interface
 */
export interface IProjectUploadAPI {
  // Authentication
  register(request: RegisterRequest): Promise<AuthResponse>;
  login(request: LoginRequest): Promise<AuthResponse>;
  logout(): Promise<void>;

  // Projects
  createProject(request: CreateProjectRequest): Promise<ProjectResponse>;
  getProject(projectId: string): Promise<ProjectResponse>;
  updateProject(projectId: string, request: Partial<CreateProjectRequest>): Promise<ProjectResponse>;
  deleteProject(projectId: string): Promise<void>;

  // File Upload
  uploadProjectFiles(projectId: string, file: File): Promise<UploadStartResponse>;
  getUploadStatus(projectId: string): Promise<UploadStatusResponse>;
  
  // File Tree
  getProjectTree(projectId: string, depth?: number): Promise<ProjectTreeResponse>;
  getFolderChildren(projectId: string, folderId?: string): Promise<FolderChildrenResponse>;
  
  // File Operations
  getFileContent(projectId: string, fileId: string): Promise<FileContentResponse>;
}

/**
 * React Component Props
 */
export interface FileTreeProps {
  projectId: string;
  token: string;
  onFileSelect?: (file: ProjectTreeNode) => void;
  onFolderOpen?: (folder: ProjectTreeNode) => void;
  depth?: number;
  loading?: boolean;
}

export interface FileUploadProps {
  projectId: string;
  token: string;
  onUploadStart?: (uploadId: string) => void;
  onUploadProgress?: (status: UploadStatusResponse) => void;
  onUploadComplete?: (result: ProjectTreeResponse) => void;
  onUploadError?: (error: ApiError) => void;
}

/**
 * Upload State Management
 */
export interface UploadState {
  isUploading: boolean;
  projectId?: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  startTime?: Date;
  estimatedTime?: number; // seconds
}

export interface TreeState {
  tree?: ProjectTreeResponse;
  currentFolder?: ProjectTreeNode;
  loading: boolean;
  error?: string;
  history: ProjectTreeNode[]; // breadcrumb trail
}

/**
 * File Type Constants
 */
export const FILE_TYPE_CATEGORIES = {
  CODE: [
    'application/javascript',
    'application/typescript',
    'text/javascript',
    'text/typescript',
    'text/python',
    'text/x-java',
    'text/x-c',
    'text/x-cpp'
  ],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown'
  ],
  IMAGE: [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'image/webp'
  ],
  VIDEO: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
  ],
  AUDIO: [
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/aac'
  ],
  ARCHIVE: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip'
  ]
};

/**
 * Utility Types
 */
export type AsyncState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  sortBy: 'name' | 'size' | 'date';
  order: 'asc' | 'desc';
}

/**
 * Helper Functions Type Definitions
 */
export interface FileTypeInfo {
  category: string;
  icon: string;
  displayName: string;
}

export interface FormattedBytes {
  value: number;
  unit: 'B' | 'KB' | 'MB' | 'GB' | 'TB';
  formatted: string;
}

/**
 * Event Types
 */
export interface FileSelectedEvent {
  file: ProjectTreeNode;
  timestamp: Date;
}

export interface UploadProgressEvent {
  projectId: string;
  progress: number;
  filesProcessed: number;
  totalFiles: number;
  status: UploadStatus;
  timestamp: Date;
}

export interface UploadCompleteEvent {
  projectId: string;
  filesCount: number;
  foldersCount: number;
  totalSize: number;
  duration: number; // ms
  timestamp: Date;
}

/**
 * Cache Interfaces
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number; // milliseconds
}

export interface ApiCache {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl?: number): void;
  clear(key?: string): void;
}

/**
 * Request/Response Interceptors
 */
export interface RequestInterceptor {
  (config: RequestInit): RequestInit;
}

export interface ResponseInterceptor {
  <T>(response: Response): Promise<T>;
}

/**
 * Constants
 */
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: (id: string) => `/projects/${id}`,
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
    UPLOAD: (id: string) => `/projects/${id}/upload`,
    UPLOAD_STATUS: (id: string) => `/projects/${id}/upload-status`,
    TREE: (id: string) => `/projects/${id}/tree`,
    FOLDER_CHILDREN: (id: string, folderId: string) => `/projects/${id}/folders/${folderId}/children`,
    FILE_CONTENT: (id: string, fileId: string) => `/projects/${id}/files/${fileId}/content`
  }
} as const;

/**
 * HTTP Status Codes
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

/**
 * Example Implementation Types
 */
export class ApiClient implements IProjectUploadAPI {
  constructor(config: ApiClientConfig) {}

  async register(request: RegisterRequest): Promise<AuthResponse> {
    throw new Error('Not implemented');
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    throw new Error('Not implemented');
  }

  async logout(): Promise<void> {
    throw new Error('Not implemented');
  }

  async createProject(request: CreateProjectRequest): Promise<ProjectResponse> {
    throw new Error('Not implemented');
  }

  async getProject(projectId: string): Promise<ProjectResponse> {
    throw new Error('Not implemented');
  }

  async updateProject(projectId: string, request: Partial<CreateProjectRequest>): Promise<ProjectResponse> {
    throw new Error('Not implemented');
  }

  async deleteProject(projectId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async uploadProjectFiles(projectId: string, file: File): Promise<UploadStartResponse> {
    throw new Error('Not implemented');
  }

  async getUploadStatus(projectId: string): Promise<UploadStatusResponse> {
    throw new Error('Not implemented');
  }

  async getProjectTree(projectId: string, depth?: number): Promise<ProjectTreeResponse> {
    throw new Error('Not implemented');
  }

  async getFolderChildren(projectId: string, folderId?: string): Promise<FolderChildrenResponse> {
    throw new Error('Not implemented');
  }

  async getFileContent(projectId: string, fileId: string): Promise<FileContentResponse> {
    throw new Error('Not implemented');
  }
}

export default ApiClient;
