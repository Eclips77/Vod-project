import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VideoRepository } from './repositories/video.repository';
import { VideoSchema } from './schemas/video.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: 'Video', schema: VideoSchema }]),
  ],
  providers: [VideoRepository],
  exports: [VideoRepository],
})
export class DatabaseModule {}
