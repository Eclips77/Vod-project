import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@app/common';
import { DatabaseModule, S3Module } from '@app/infrastructure';
import { VideoProcessorController } from './video-processor/video-processor.controller';
import { VideoProcessorService } from './video-processor/video-processor.service';
import { FfmpegModule } from './ffmpeg/ffmpeg.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    DatabaseModule,
    S3Module,
    FfmpegModule,
  ],
  controllers: [VideoProcessorController],
  providers: [VideoProcessorService],
})
export class AppModule {}
