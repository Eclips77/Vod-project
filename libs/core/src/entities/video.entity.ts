export enum VideoStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class Video {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public status: VideoStatus = VideoStatus.PENDING,
    public originalUrl?: string,
    public processedUrl?: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}
}
