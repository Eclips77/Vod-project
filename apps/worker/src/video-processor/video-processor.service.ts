import { Injectable, Logger } from '@nestjs/common';
import { FfmpegService } from '../ffmpeg/ffmpeg.service';
import { S3Service, VideoRepository } from '@app/infrastructure';
import { VideoStatus } from '@app/core';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { pipeline } from 'stream/promises';

@Injectable()
export class VideoProcessorService {
  private readonly logger = new Logger(VideoProcessorService.name);

  constructor(
    private readonly ffmpegService: FfmpegService,
    private readonly s3Service: S3Service,
    private readonly videoRepository: VideoRepository,
  ) {}

  async processVideo(videoId: string, key: string) {
    this.logger.log(`Starting video processing for ${videoId}`);

    const tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'video-processing-'),
    );
    const inputPath = path.join(tempDir, 'input.mp4');
    const outputDir = path.join(tempDir, 'output');

    try {
      // Create output directory
      await fs.promises.mkdir(outputDir, { recursive: true });

      // 1. Download raw video
      this.logger.debug(`Downloading ${key} to ${inputPath}`);
      const downloadStream = await this.s3Service.download(key);
      await pipeline(downloadStream, fs.createWriteStream(inputPath));

      // 2. Transcode
      this.logger.debug(`Transcoding ${inputPath} to HLS`);
      await this.ffmpegService.transcode(inputPath, outputDir);

      // 3. Upload encoded files
      this.logger.debug(`Uploading encoded files to S3`);
      const files = await fs.promises.readdir(outputDir);
      let playlistUrl = '';

      for (const file of files) {
        const filePath = path.join(outputDir, file);
        const fileContent = fs.createReadStream(filePath);
        const s3Key = `encoded/${videoId}/${file}`;
        const contentType = file.endsWith('.m3u8')
          ? 'application/vnd.apple.mpegurl'
          : 'video/MP2T';

        const url = await this.s3Service.upload(
          s3Key,
          fileContent,
          contentType,
          'public, max-age=31536000',
        );
        if (file.endsWith('.m3u8')) {
          playlistUrl = url;
        }
      }

      // 4. Update Metadata
      this.logger.log(`Video processing completed. Updating metadata.`);
      const video = await this.videoRepository.findById(videoId);
      if (video) {
        video.status = VideoStatus.COMPLETED;
        video.processedUrl = playlistUrl;
        await this.videoRepository.update(video);
      }
    } catch (error) {
      this.logger.error(`Video processing failed for ${videoId}`, error);
      // Update status to FAILED if critical error?
      // For retry logic, better allow retry. If permanent failure, DLQ handler will mark FAILED.
      // But for now, we can update status to FAILED to reflect current state, but retrying will overwrite.
      // Let's rely on RabbitMQ retry mechanism.
      throw error;
    } finally {
      // 5. Cleanup
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        this.logger.warn(`Failed to cleanup temp directory ${tempDir}`, e);
      }
    }
  }
}
