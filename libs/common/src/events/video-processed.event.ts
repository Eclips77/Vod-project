export class VideoProcessedEvent {
  constructor(
    public readonly id: string,
    public readonly processedUrl: string,
  ) {}
}
