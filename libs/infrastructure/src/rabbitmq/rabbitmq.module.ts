import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VIDEO_PROCESSING_SERVICE, VIDEO_QUEUE } from './constants';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: VIDEO_PROCESSING_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitMqUri = configService.get<string>('RABBITMQ_URI');
          if (!rabbitMqUri) {
            throw new Error('RABBITMQ_URI is not defined');
          }
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitMqUri],
              queue: VIDEO_QUEUE,
              queueOptions: {
                durable: true, // Durable queue
                deadLetterExchange: '', // Default exchange
                deadLetterRoutingKey: `${VIDEO_QUEUE}_dlq`, // DLQ routing key
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [RabbitMQService],
  exports: [ClientsModule, RabbitMQService],
})
export class RabbitMQModule {}
