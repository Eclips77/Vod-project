import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from './logger.service';
import * as winston from 'winston';

jest.mock('winston', () => {
  const mFormat = {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
  };
  const mTransports = {
    Console: jest.fn(),
  };
  const mLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
  return {
    createLogger: jest.fn(() => mLogger),
    format: mFormat,
    transports: mTransports,
  };
});

describe('AppLogger', () => {
  let service: AppLogger;
  let winstonLogger: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppLogger],
    }).compile();

    service = module.get<AppLogger>(AppLogger);
    // Access private property for testing purposes
    winstonLogger = (service as any).logger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should configure winston logger correctly on initialization', () => {
    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        transports: expect.any(Array),
      }),
    );
  });

  describe('log', () => {
    it('should call winston info with message and context', () => {
      const message = 'test message';
      const context = 'TestContext';
      const traceId = 'trace-123';

      service.log(message, context, traceId);

      expect(winstonLogger.info).toHaveBeenCalledWith(message, {
        context,
        traceId,
      });
    });
  });

  describe('error', () => {
    it('should call winston error with message, trace and context', () => {
      const message = 'error message';
      const trace = 'stack trace';
      const context = 'TestContext';
      const traceId = 'trace-123';

      service.error(message, trace, context, traceId);

      expect(winstonLogger.error).toHaveBeenCalledWith(message, {
        trace,
        context,
        traceId,
      });
    });
  });

  describe('warn', () => {
    it('should call winston warn with message and context', () => {
      const message = 'warn message';
      const context = 'TestContext';
      const traceId = 'trace-123';

      service.warn(message, context, traceId);

      expect(winstonLogger.warn).toHaveBeenCalledWith(message, {
        context,
        traceId,
      });
    });
  });

  describe('debug', () => {
    it('should call winston debug with message and context', () => {
      const message = 'debug message';
      const context = 'TestContext';
      const traceId = 'trace-123';

      service.debug(message, context, traceId);

      expect(winstonLogger.debug).toHaveBeenCalledWith(message, {
        context,
        traceId,
      });
    });
  });

  describe('verbose', () => {
    it('should call winston verbose with message and context', () => {
      const message = 'verbose message';
      const context = 'TestContext';
      const traceId = 'trace-123';

      service.verbose(message, context, traceId);

      expect(winstonLogger.verbose).toHaveBeenCalledWith(message, {
        context,
        traceId,
      });
    });
  });
});
