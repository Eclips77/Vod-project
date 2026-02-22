import { Test, TestingModule } from '@nestjs/testing';
import { FfmpegService } from './ffmpeg.service';
import * as ffmpeg from 'fluent-ffmpeg';
import { EventEmitter } from 'events';

jest.mock('fluent-ffmpeg');

describe('FfmpegService', () => {
  let service: FfmpegService;
  let ffmpegMock: any;
  let commandMock: any;

  beforeEach(async () => {
    commandMock = new EventEmitter();
    commandMock.outputOptions = jest.fn().mockReturnThis();
    commandMock.output = jest.fn().mockReturnThis();
    commandMock.on = jest.fn().mockImplementation((event, callback) => {
      commandMock.addListener(event, callback);
      return commandMock;
    });
    commandMock.run = jest.fn();

    (ffmpeg as unknown as jest.Mock).mockReturnValue(commandMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [FfmpegService],
    }).compile();

    service = module.get<FfmpegService>(FfmpegService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    commandMock.removeAllListeners();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transcode', () => {
    it('should transcode video successfully', async () => {
      const inputPath = 'input.mp4';
      const outputDir = 'output';
      const expectedOutput = 'output/playlist.m3u8';

      const promise = service.transcode(inputPath, outputDir);

      // Emit events to simulate FFmpeg lifecycle
      commandMock.emit('start', 'ffmpeg -i input.mp4 ...');
      commandMock.emit('progress', { percent: 50 });
      commandMock.emit('end');

      const result = await promise;
      expect(result).toBe(expectedOutput);
      expect(ffmpeg).toHaveBeenCalledWith(inputPath);
      expect(commandMock.outputOptions).toHaveBeenCalled();
      expect(commandMock.output).toHaveBeenCalledWith(expectedOutput);
      expect(commandMock.run).toHaveBeenCalled();
    });

    it('should handle ffmpeg error', async () => {
      const inputPath = 'input.mp4';
      const outputDir = 'output';
      const error = new Error('FFmpeg failed');

      const promise = service.transcode(inputPath, outputDir);

      commandMock.emit('error', error);

      await expect(promise).rejects.toThrow('FFmpeg failed');
    });

    it('should log progress', async () => {
      const inputPath = 'input.mp4';
      const outputDir = 'output';

      // Spy on logger
      const loggerSpy = jest.spyOn((service as any).logger, 'debug');

      const promise = service.transcode(inputPath, outputDir);

      commandMock.emit('progress', { percent: 50 });
      commandMock.emit('end');

      await promise;

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('50% done'));
    });
  });
});
