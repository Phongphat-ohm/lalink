import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  IStorageService,
  StorageConfig,
  UploadOptions,
  UploadResult,
} from "./types";

export class S3StorageService implements IStorageService {
  private client: S3Client;
  private bucketName: string;
  private isMockMode: boolean;

  constructor(config?: Partial<StorageConfig>) {
    this.bucketName =
      config?.bucketName ||
      process.env.S3_BUCKET ||
      process.env.S3_BUCKET_NAME ||
      "lalink-attachments";

    const endpoint = config?.endpoint || process.env.S3_ENDPOINT;
    const region = config?.region || process.env.S3_REGION || "ap-southeast-1";
    const accessKeyId = config?.accessKeyId || process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey =
      config?.secretAccessKey || process.env.S3_SECRET_ACCESS_KEY;
    const forcePathStyle =
      config?.forcePathStyle ??
      (process.env.S3_FORCE_PATH_STYLE === "true" || !!endpoint);

    // If credentials are not set, run in safe mock/fallback mode for development & tests
    if (!accessKeyId || !secretAccessKey) {
      this.isMockMode = true;
      this.client = new S3Client({
        region,
        credentials: {
          accessKeyId: "mock_key",
          secretAccessKey: "mock_secret",
        },
      });
    } else {
      this.isMockMode = false;
      this.client = new S3Client({
        region,
        endpoint,
        forcePathStyle,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  /**
   * Upload object directly to S3 bucket
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    const { key, buffer, contentType, metadata } = options;

    if (!this.isMockMode) {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.client.send(command);
    }

    return {
      key,
      bucket: this.bucketName,
      size: buffer.byteLength,
      contentType,
    };
  }

  /**
   * Delete object from S3 bucket
   */
  async delete(key: string): Promise<void> {
    if (this.isMockMode) return;

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Get object stream/buffer from S3 bucket
   */
  async getObject(key: string): Promise<Buffer | null> {
    if (this.isMockMode) return null;
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.client.send(command);
      if (!response.Body) return null;
      const byteArray = await response.Body.transformToByteArray();
      return Buffer.from(byteArray);
    } catch (err) {
      console.error("S3 getObject error:", err);
      return null;
    }
  }

  /**
   * Generate Temporary Pre-signed Download URL (default 15 minutes)
   */
  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds: number = 900,
  ): Promise<string> {
    if (this.isMockMode) {
      return `https://storage.lalink.local/${this.bucketName}/${key}?token=mock_signed_download_token&expires=${expiresInSeconds}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  /**
   * Generate Temporary Pre-signed Upload URL (default 15 minutes)
   */
  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds: number = 900,
  ): Promise<string> {
    if (this.isMockMode) {
      return `https://storage.lalink.local/${this.bucketName}/${key}?token=mock_signed_upload_token&contentType=${encodeURIComponent(
        contentType,
      )}&expires=${expiresInSeconds}`;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
  }
}

// Global Singleton Instance
export const storageService = new S3StorageService();
