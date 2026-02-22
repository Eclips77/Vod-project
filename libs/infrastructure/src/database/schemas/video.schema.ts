import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { VideoStatus } from '@app/core';

export type VideoDocument = Video & Document;

@Schema({ timestamps: true })
export class Video {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: String, enum: VideoStatus, default: VideoStatus.PENDING })
  status!: VideoStatus;

  @Prop()
  originalUrl?: string;

  @Prop()
  processedUrl?: string;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
