import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';

@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);

  async transcode(inputPath: string, outputDir: string): Promise<string> {
    const outputPath = path.join(outputDir, 'playlist.m3u8');

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-hls_time 10', // 10 second segments
          '-hls_list_size 0', // Include all segments in the playlist
          '-c:v libx264', // Video codec
          '-preset veryfast', // Optimize for speed
          '-c:a aac', // Audio codec
          '-f hls', // Format
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          this.logger.log(`Spawned Ffmpeg with command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          this.logger.debug(`Processing: ${progress.percent}% done`);
        })
        .on('error', (err) => {
          this.logger.error(
            `Error processing video: ${err.message}`,
            err.stack,
          );
          reject(err);
        })
        .on('end', () => {
          this.logger.log('Transcoding finished successfully');
          resolve(outputPath);
        })
        .run();
    });
  }
}
