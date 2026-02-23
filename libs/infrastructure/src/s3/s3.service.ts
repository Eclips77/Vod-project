import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { IStorageService } from '@app/core';

@Injectable()
export class S3Service implements IStorageService {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const bucketName = this.configService.get<string>('S3_BUCKET_NAME');
    const region = this.configService.get<string>('AWS_REGION');

    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME is not defined in configuration');
    }

    this.bucketName = bucketName;

    this.s3Client = new S3Client({
      region,
      maxAttempts: 3, // Retry strategy (built-in exponential backoff)
    });
  }

  async getUploadPresignedUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for ${key}`, error);
      throw error;
    }
  }

  async upload(
    key: string,
    file: Buffer | Readable,
    contentType: string,
  ): Promise<string> {
    try {
      const parallelUploads3 = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: file,
          ContentType: contentType,
        },
      });

      parallelUploads3.on('httpUploadProgress', (progress) => {
        this.logger.debug(
          `Upload progress for ${key}: ${JSON.stringify(progress)}`,
        );
      });

      await parallelUploads3.done();
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}`, error);
      throw error;
    }
  }

  async download(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } catch (error) {
      this.logger.error(`Failed to download file ${key}`, error);
      throw error;
    }
  }
}
