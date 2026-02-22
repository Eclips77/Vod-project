import { Injectable, NotFoundException } from '@nestjs/common';
import { VideoRepository, RabbitMQService } from '@app/infrastructure';
import { VideoStatus } from '@app/core';

@Injectable()
export class ProcessVideoUseCase {
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async execute(id: string, traceId: string) {
    const video = await this.videoRepository.findById(id);
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    if (
      video.status === VideoStatus.PROCESSING ||
      video.status === VideoStatus.COMPLETED
    ) {
      return { message: 'Video is already being processed or completed' };
    }

    // Update status to PROCESSING
    video.status = VideoStatus.PROCESSING;
    await this.videoRepository.update(video);

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
