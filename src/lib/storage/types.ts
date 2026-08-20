export interface StorageConfig {
  endpoint?: string;
  region?: string;
  bucketName: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
}

export interface UploadOptions {
  key: string;
  buffer: Uint8Array | Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  bucket: string;
  size: number;
  contentType: string;
}

export interface IStorageService {
  upload(options: UploadOptions): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getObject(key: string): Promise<Buffer | null>;
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<string>;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  mimeType?: string;
  extension?: string;
}
