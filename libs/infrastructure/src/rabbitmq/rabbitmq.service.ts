import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { timeout, retryWhen, delay, scan } from 'rxjs/operators';
import { VIDEO_PROCESSING_SERVICE } from './constants';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(
    @Inject(VIDEO_PROCESSING_SERVICE) private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
    }
  }

  async sendToQueue(
    pattern: string,
    data: any,
    headers: Record<string, string> = {},
  ) {
    // Inject headers into payload or use RabbitMQ properties if supported by ClientProxy directly
    // NestJS ClientProxy uses pattern + data.
    // To send headers, we usually wrap data in `RmqRecordBuilder` or just send data.
    // But `RmqRecordBuilder` is cleaner.

    // For simplicity with standard ClientProxy emit:
    // We can't easily set headers on `emit` without using `RmqRecordBuilder`.
    // But `RmqRecordBuilder` is available in `@nestjs/microservices`.

    // Let's use `RmqRecordBuilder`.

    // Wait, ClientProxy.emit doesn't support RmqRecordBuilder directly in older Nest versions?
    // It does in NestJS 10.

    // But let's check imports.
    return lastValueFrom(
      this.client
        .emit(pattern, { ...data, headers }) // Simplest way: include headers in payload for application-level handling
        .pipe(
          timeout(5000),
          retryWhen((errors) =>
            errors.pipe(
              scan((acc, error) => {
                if (acc >= 3) throw error;
                return acc + 1;
              }, 0),
              delay(1000),
            ),
          ),
        ),
    );
  }
}
