import { Video } from '../entities/video.entity';

export interface IVideoRepository {
  create(video: Video): Promise<Video>;
  findById(id: string): Promise<Video | null>;
  findAll(): Promise<Video[]>;
  update(video: Video): Promise<Video>;
  delete(id: string): Promise<void>;
  startProcessing(id: string): Promise<Video | null>;
}
