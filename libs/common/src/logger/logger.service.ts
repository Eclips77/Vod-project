import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class AppLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [new winston.transports.Console()],
    });
  }

  log(message: string, context?: string, traceId?: string) {
    this.logger.info(message, { context, traceId });
  }

  error(message: string, trace?: string, context?: string, traceId?: string) {
    this.logger.error(message, { trace, context, traceId });
  }

  warn(message: string, context?: string, traceId?: string) {
    this.logger.warn(message, { context, traceId });
  }

  debug(message: string, context?: string, traceId?: string) {
    this.logger.debug(message, { context, traceId });
  }

  verbose(message: string, context?: string, traceId?: string) {
    this.logger.verbose(message, { context, traceId });
  }
}
