import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { VIDEO_QUEUE } from '@app/infrastructure';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Worker-Bootstrap');
  const tempApp = await NestFactory.createApplicationContext(AppModule);
  const configService = tempApp.get(ConfigService);
  const rmqUrl = configService.get<string>('RABBITMQ_URI');
  await tempApp.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: VIDEO_QUEUE,
        noAck: false, // Manual Acknowledgment
        queueOptions: {
          durable: true,
          deadLetterExchange: '',
          deadLetterRoutingKey: `${VIDEO_QUEUE}_dlq`,
        },
      },
    },
  );

  app.enableShutdownHooks();

  await app.listen();
  logger.log('Worker Service is listening for messages');
}
bootstrap();
