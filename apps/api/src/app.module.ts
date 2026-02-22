import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import {
  CommonModule,
  HttpExceptionFilter,
  RequestIdMiddleware,
} from '@app/common';
import { DatabaseModule, S3Module, RabbitMQModule } from '@app/infrastructure';
import { VideoController } from './controllers/video.controller';
import { CreateVideoUseCase } from './usecases/create-video.usecase';
import { GetVideoUseCase } from './usecases/get-video.usecase';
import { ProcessVideoUseCase } from './usecases/process-video.usecase';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    DatabaseModule,
    S3Module,
    RabbitMQModule,
  ],
  controllers: [VideoController],
  providers: [
    CreateVideoUseCase,
    GetVideoUseCase,
    ProcessVideoUseCase,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
