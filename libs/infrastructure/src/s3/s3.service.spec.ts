import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('@aws-sdk/lib-storage');

describe('S3Service', () => {
  let service: S3Service;
  let s3ClientMock: any;
  let configServiceMock: any;

  beforeEach(async () => {
    configServiceMock = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'S3_BUCKET_NAME') return 'test-bucket';
        if (key === 'AWS_REGION') return 'us-east-1';
        return null;
      }),
    };

    s3ClientMock = {
      send: jest.fn(),
    };
    (S3Client as unknown as jest.Mock).mockImplementation(() => s3ClientMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUploadPresignedUrl', () => {
    it('should return a presigned URL for upload', async () => {
      const key = 'test-key';
      const contentType = 'video/mp4';
      const expectedUrl = 'https://presigned-url';

      (getSignedUrl as jest.Mock).mockResolvedValue(expectedUrl);

      const result = await service.getUploadPresignedUrl(key, contentType);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(Object), // s3Client
        expect.any(PutObjectCommand),
        expect.objectContaining({ expiresIn: 3600 }),
      );
      expect(result).toBe(expectedUrl);
    });
  });

  describe('upload', () => {
    it('should upload a file using Upload lib', async () => {
      const key = 'test-key';
      const file = Buffer.from('test');
      const contentType = 'text/plain';

      const mockUploadInstance = {
        done: jest.fn().mockResolvedValue({}),
        on: jest.fn(),
      };
      (Upload as unknown as jest.Mock).mockImplementation(
        () => mockUploadInstance,
      );

      const result = await service.upload(key, file, contentType);

      expect(Upload).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: key,
            Body: file,
            ContentType: contentType,
          }),
        }),
      );
      expect(mockUploadInstance.done).toHaveBeenCalled();
      expect(result).toBe(`https://test-bucket.s3.amazonaws.com/${key}`);
    });
  });

  describe('download', () => {
    it('should download a file as stream', async () => {
      const key = 'test-key';
      const mockStream = new Readable();
      s3ClientMock.send.mockResolvedValue({ Body: mockStream });

      const result = await service.download(key);

      expect(s3ClientMock.send).toHaveBeenCalledWith(
        expect.any(GetObjectCommand),
      );
      expect(result).toBe(mockStream);
    });
  });
});
