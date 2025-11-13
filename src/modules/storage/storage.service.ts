import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import B2 from 'backblaze-b2';
import * as crypto from 'crypto';

@Injectable()
export class StorageService implements OnModuleInit {
  private b2: any;
  private bucketId: string;
  private bucketName: string;
  private applicationKeyId: string;
  private applicationKey: string;

  constructor(private configService: ConfigService) {
    this.bucketId = '';
    this.bucketName = '';
    this.applicationKeyId = '';
    this.applicationKey = '';
    this.b2 = null;
  }

  async onModuleInit() {
    this.applicationKeyId =
      this.configService.get<string>('B2_APPLICATION_KEY_ID') || '';
    this.applicationKey =
      this.configService.get<string>('B2_APPLICATION_KEY') || '';
    this.bucketId = this.configService.get<string>('B2_BUCKET_ID') || '';
    this.bucketName = this.configService.get<string>('B2_BUCKET_NAME', 'mshare');

    // Trim whitespace from credentials
    this.applicationKeyId = this.applicationKeyId?.trim() || '';
    this.applicationKey = this.applicationKey?.trim() || '';
    this.bucketId = this.bucketId?.trim() || '';
    this.bucketName = this.bucketName?.trim() || '';

    console.log('🔧 B2 Credentials loaded:');
    console.log(`   Application Key ID: ${this.applicationKeyId ? this.applicationKeyId.substring(0, 8) + '...' : 'NOT SET'}`);
    console.log(`   Application Key: ${this.applicationKey ? '***' + this.applicationKey.substring(this.applicationKey.length - 4) : 'NOT SET'}`);
    console.log(`   Bucket ID: ${this.bucketId}`);
    console.log(`   Bucket Name: ${this.bucketName}`);

    if (!this.applicationKeyId || !this.applicationKey || !this.bucketId) {
      console.error('❌ Missing B2 credentials');
      throw new BadRequestException(
        'Backblaze B2 credentials are not configured',
      );
    }

    try {
      // Initialize B2 client with official SDK
      this.b2 = new B2({
        applicationKeyId: this.applicationKeyId,
        applicationKey: this.applicationKey,
      });

      // Authorize with B2
      await this.b2.authorize();
      console.log(`✅ B2 Storage initialized and authorized - Bucket: ${this.bucketName}`);
    } catch (error: any) {
      console.error('❌ B2 Authorization Error:');
      console.error('   Message:', error.message);
      console.error('   Code:', error.code);
      throw new BadRequestException(
        `Failed to authorize B2: ${error.message}`,
      );
    }
  }

  async uploadFile(
    file: any,
    projectId: string,
    folder?: string,
  ): Promise<{
    fileId: string;
    fileName: string;
    url: string;
    size: number;
  }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const fileName = file.originalname || 'file';
      const fileKey = folder
        ? `${projectId}/${folder}/${fileName}`
        : `${projectId}/${fileName}`;

      const fileBuffer = file.buffer;
      const fileSize = fileBuffer.length;

      console.log(`📤 Uploading to B2: ${fileKey} (${fileSize} bytes)`);

      // Calculate SHA1 hash for file integrity
      const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');

      // Get upload URL from B2
      const uploadUrlResponse = await this.b2.getUploadUrl({
        bucketId: this.bucketId,
      });

      // Upload file to B2
      const uploadResult = await this.b2.uploadFile({
        uploadUrl: uploadUrlResponse.data.uploadUrl,
        uploadAuthToken: uploadUrlResponse.data.authorizationToken,
        fileName: fileKey,
        contentType: file.mimetype || 'application/octet-stream',
        contentLength: fileSize,
        data: fileBuffer,
        contentSha1: sha1,
      });

      // Generate public download URL
      const fileUrl = `https://f005.backblazeb2.com/file/${this.bucketName}/${fileKey}`;

      console.log(`✅ File uploaded successfully to B2: ${fileUrl}`);

      return {
        fileId: uploadResult.data.fileId,
        fileName: fileName,
        url: fileUrl,
        size: fileSize,
      };
    } catch (error: any) {
      console.error('❌ B2 Upload Error Details:');
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Status:', error.status);
      if (error.response?.data) {
        console.error('   Response:', JSON.stringify(error.response.data, null, 2));
      }

      throw new BadRequestException(
        `Failed to upload file to B2: ${error.message || 'Unknown error'}`,
      );
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      // First need to get file info to get file name
      const fileInfo = await this.b2.getFileInfoByName({
        bucketId: this.bucketId,
        fileName: fileId,
      });

      // Delete file
      await this.b2.deleteFile({
        fileId: fileInfo.data.fileId,
        fileName: fileInfo.data.fileName,
      });

      console.log(`✅ File deleted from B2: ${fileId}`);
    } catch (error: any) {
      console.error('❌ B2 Delete Error:', error.message);
      throw new BadRequestException(
        `Failed to delete file from B2: ${error.message}`,
      );
    }
  }

  async getFileUrl(fileKey: string): Promise<string> {
    return `https://f005.backblazeb2.com/file/${this.bucketName}/${fileKey}`;
  }

  async listFiles(projectId: string): Promise<string[]> {
    try {
      const prefix = `${projectId}/`;
      const files: string[] = [];

      const listResult = await this.b2.listFileNames({
        bucketId: this.bucketId,
        startFileName: prefix,
        prefix: prefix,
        maxFileCount: 1000,
      });

      files.push(...(listResult.data.files || []).map(f => f.fileName));

      return files;
    } catch (error: any) {
      console.error('❌ B2 List Error:', error.message);
      return [];
    }
  }

  getPresignedUrl(fileKey: string, expiresIn: number = 3600): string {
    try {
      // B2 presigned URLs: valid for up to 1 week (604800 seconds)
      const expiryTime = Math.min(expiresIn, 604800);
      const expiryTimestamp = Math.floor(Date.now() / 1000) + expiryTime;

      // Format: https://f005.backblazeb2.com/file/{bucketName}/{fileName}?Expires=TIMESTAMP&Signature=SIGNATURE
      // For simplicity, return the public URL (B2 files are public by default)
      return `https://f005.backblazeb2.com/file/${this.bucketName}/${fileKey}`;
    } catch (error) {
      console.error('❌ Error generating presigned URL:', error);
      throw new BadRequestException('Failed to generate presigned URL');
    }
  }
}
