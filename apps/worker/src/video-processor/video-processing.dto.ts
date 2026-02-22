import { IsString, IsNotEmpty } from 'class-validator';

export class VideoProcessingDto {
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsNotEmpty()
  headers: {
    traceId: string;
  };
}
