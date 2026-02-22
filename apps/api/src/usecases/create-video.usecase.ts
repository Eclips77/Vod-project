import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateVideoDto } from '@app/common';
import { Video, VideoStatus } from '@app/core';
import { VideoRepository, S3Service } from '@app/infrastructure';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateVideoUseCase {
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(createVideoDto: CreateVideoDto) {
    const videoId = uuidv4();
    const key = `raw/${videoId}`;

    // Create Metadata
    const video = new Video(
      videoId,
      createVideoDto.title,
      createVideoDto.description,
      VideoStatus.PENDING,
      undefined,
      undefined,
      new Date(),
      new Date(),
    );

    try {
      await this.videoRepository.create(video);

      // Generate Presigned URL
      const uploadUrl = await this.s3Service.getPresignedUrl(
        key,
        'video/mp4',
        3600,
      );

      return {
        id: videoId,
        uploadUrl,
        key,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
