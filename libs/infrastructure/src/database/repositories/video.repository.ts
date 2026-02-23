import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VideoDocument, Video } from '../schemas/video.schema';
import { IVideoRepository, Video as VideoEntity, VideoStatus } from '@app/core';

@Injectable()
export class VideoRepository implements IVideoRepository {
  constructor(
    @InjectModel(Video.name) private readonly videoModel: Model<VideoDocument>,
  ) {}

  async create(video: VideoEntity): Promise<VideoEntity> {
    const createdVideo = new this.videoModel(video);
    const savedVideo = await createdVideo.save();
    return this.mapToEntity(savedVideo);
  }

  async findById(id: string): Promise<VideoEntity | null> {
    const foundVideo = await this.videoModel.findById(id).exec();
    return foundVideo ? this.mapToEntity(foundVideo) : null;
  }

  async findAll(): Promise<VideoEntity[]> {
    const videos = await this.videoModel.find().exec();
    return videos.map((video) => this.mapToEntity(video));
  }

  async update(video: VideoEntity): Promise<VideoEntity> {
    const updatedVideo = await this.videoModel
      .findByIdAndUpdate(video.id, video, { new: true })
      .exec();

    if (!updatedVideo) {
      throw new NotFoundException(`Video with ID ${video.id} not found`);
    }

    return this.mapToEntity(updatedVideo);
  }

  async startProcessing(id: string): Promise<VideoEntity | null> {
    const updatedVideo = await this.videoModel
      .findOneAndUpdate(
        {
          _id: id,
          status: { $nin: [VideoStatus.PROCESSING, VideoStatus.COMPLETED] },
        },
        { status: VideoStatus.PROCESSING },
        { new: true },
      )
      .exec();

    return updatedVideo ? this.mapToEntity(updatedVideo) : null;
  }

  async delete(id: string): Promise<void> {
    await this.videoModel.findByIdAndDelete(id).exec();
  }

  private mapToEntity(videoDocument: VideoDocument): VideoEntity {
    return new VideoEntity(
      videoDocument._id.toString(),
      videoDocument.title,
      videoDocument.description,
      videoDocument.status,
      videoDocument.originalUrl,
      videoDocument.processedUrl,
      (videoDocument as any).createdAt,
      (videoDocument as any).updatedAt,
    );
  }
}
