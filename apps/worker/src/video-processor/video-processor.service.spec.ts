import { Test, TestingModule } from '@nestjs/testing';
import { VideoProcessorService } from './video-processor.service';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { S3Service, VideoRepository } from '@app/infrastructure';
import { VideoStatus } from '@app/core';
import * as fs from 'fs';
import * as os from 'os';
import { Readable } from 'stream';

jest.mock('fs', () => ({
  promises: {
    mkdtemp: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    rm: jest.fn(),
  },
  createWriteStream: jest.fn(),
  createReadStream: jest.fn(),
}));

jest.mock('os', () => ({
  ...jest.requireActual('os'),
  tmpdir: jest.fn(),
}));

jest.mock('stream/promises', () => ({
  pipeline: jest.fn(),
}));

describe('VideoProcessorService', () => {
  let service: VideoProcessorService;
  let ffmpegService: FfmpegService;
  let s3Service: S3Service;
  let videoRepository: VideoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoProcessorService,
        {
          provide: FfmpegService,
          useValue: {
            transcode: jest.fn(),
          },
        },
        {
          provide: S3Service,
          useValue: {
            download: jest.fn(),
            upload: jest.fn(),
          },
        },
        {
          provide: VideoRepository,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VideoProcessorService>(VideoProcessorService);
    ffmpegService = module.get<FfmpegService>(FfmpegService);
    s3Service = module.get<S3Service>(S3Service);
    videoRepository = module.get<VideoRepository>(VideoRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processVideo', () => {
    it('should process video successfully', async () => {
      const videoId = 'test-video-id';
      const key = 'raw/test-video-id';
      const tempDir = '/tmp/video-processing-123';

      (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
      (fs.promises.mkdtemp as jest.Mock).mockResolvedValue(tempDir);
      (fs.promises.readdir as jest.Mock).mockResolvedValue([
        'playlist.m3u8',
        'segment0.ts',
      ]);

      const mockDownloadStream = new Readable();
      mockDownloadStream.push(null); // End stream immediately
      (s3Service.download as jest.Mock).mockResolvedValue(mockDownloadStream);

      const mockReadStream = new Readable();
      mockReadStream.push(null);
      (fs.createReadStream as jest.Mock).mockReturnValue(mockReadStream);

      (s3Service.upload as jest.Mock).mockResolvedValue(
        'https://s3-bucket/encoded/playlist.m3u8',
      );

      (videoRepository.findById as jest.Mock).mockResolvedValue({
        id: videoId,
        status: VideoStatus.PROCESSING,
      });

      await service.processVideo(videoId, key);

      expect(fs.promises.mkdtemp).toHaveBeenCalledWith(
        expect.stringContaining('video-processing-'),
      );
      expect(s3Service.download).toHaveBeenCalledWith(key);
      expect(ffmpegService.transcode).toHaveBeenCalledWith(
        expect.stringContaining('input.mp4'),
        expect.stringContaining('output'),
      );
      expect(s3Service.upload).toHaveBeenCalledTimes(2); // playlist + 1 segment
      expect(s3Service.upload).toHaveBeenCalledWith(
        expect.stringContaining('encoded/test-video-id/'),
        expect.anything(),
        expect.stringMatching(/application\/vnd\.apple\.mpegurl|video\/MP2T/),
        'public, max-age=31536000',
      );

      expect(videoRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: videoId,
          status: VideoStatus.COMPLETED,
          processedUrl: 'https://s3-bucket/encoded/playlist.m3u8',
        }),
      );
      expect(fs.promises.rm).toHaveBeenCalledWith(tempDir, {
        recursive: true,
        force: true,
      });
    });

    it('should handle errors and cleanup', async () => {
      const videoId = 'test-video-id';
      const key = 'raw/test-video-id';
      const error = new Error('Download failed');

      (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
      (fs.promises.mkdtemp as jest.Mock).mockResolvedValue(
        '/tmp/video-processing-error',
      );
      (s3Service.download as jest.Mock).mockRejectedValue(error);

      await expect(service.processVideo(videoId, key)).rejects.toThrow(error);

      expect(fs.promises.rm).toHaveBeenCalledWith(
        '/tmp/video-processing-error',
        { recursive: true, force: true },
      );
    });
  });
});
