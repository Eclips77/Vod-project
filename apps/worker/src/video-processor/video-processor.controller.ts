import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { VideoProcessorService } from './video-processor.service';
import { Message } from 'amqplib';
import { AppLogger } from '@app/common';
import { VideoProcessingDto } from './video-processing.dto';

@Controller()
export class VideoProcessorController {
  constructor(
    private readonly videoProcessorService: VideoProcessorService,
    private readonly logger: AppLogger,
  ) {}

  @EventPattern('video_processing')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleVideoProcessing(
    @Payload() data: VideoProcessingDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage() as Message;
    const { videoId, key, headers } = data;
    const traceId = headers?.traceId || 'unknown-trace-id';

    this.logger.log(
      `Received video processing task for videoId: ${videoId}`,
      VideoProcessorController.name,
      traceId,
    );

    try {
      await this.videoProcessorService.processVideo(videoId, key);
      channel.ack(originalMsg);
      this.logger.log(
        `Successfully processed video ${videoId}`,
        VideoProcessorController.name,
        traceId,
      );
    } catch (error) {
      this.logger.error(
        `Error processing video ${videoId}`,
        (error as Error).stack,
        VideoProcessorController.name,
        traceId,
      );

      const rabbitHeaders = originalMsg.properties.headers || {};
      const deathHeader = rabbitHeaders['x-death'];

      let retryCount = 0;
      if (deathHeader && deathHeader.length > 0) {
        retryCount = deathHeader[0].count;
      }

      const MAX_RETRIES = 3;
      if (retryCount >= MAX_RETRIES) {
        this.logger.warn(
          `Max retries reached for video ${videoId}. Sending to DLQ.`,
          VideoProcessorController.name,
          traceId,
        );
        channel.nack(originalMsg, false, false);
      } else {
        this.logger.log(
          `Requeuing video ${videoId}. Attempt ${retryCount + 1}`,
          VideoProcessorController.name,
          traceId,
        );
        channel.nack(originalMsg, false, false);
      }
    }
  }
}
