import { Injectable, NotFoundException } from '@nestjs/common';
import { VideoRepository, RabbitMQService } from '@app/infrastructure';

@Injectable()
export class ProcessVideoUseCase {
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async execute(id: string, traceId: string) {
    const video = await this.videoRepository.startProcessing(id);

    if (!video) {
      // Check if video exists to provide correct error message
      const existingVideo = await this.videoRepository.findById(id);
      if (!existingVideo) {
        throw new NotFoundException(`Video with ID ${id} not found`);
      }
      return { message: 'Video is already being processed or completed' };
    }

    // Publish to RabbitMQ
    await this.rabbitMQService.sendToQueue(
      'video_processing',
      {
        videoId: video.id,
        key: `raw/${video.id}`, // Assuming key format
      },
      {
        traceId,
      },
    );

    return { message: 'Video processing started', videoId: video.id };
  }
}
