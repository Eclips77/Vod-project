import { Injectable, NotFoundException } from '@nestjs/common';
import { VideoRepository } from '@app/infrastructure';

@Injectable()
export class GetVideoUseCase {
  constructor(private readonly videoRepository: VideoRepository) {}

  async execute(id: string) {
    const video = await this.videoRepository.findById(id);
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }
    return video;
  }
}
