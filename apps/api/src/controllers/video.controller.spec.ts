import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from './video.controller';
import { CreateVideoUseCase } from '../usecases/create-video.usecase';
import { GetVideoUseCase } from '../usecases/get-video.usecase';
import { ProcessVideoUseCase } from '../usecases/process-video.usecase';
import { CreateVideoDto } from '@app/common';
import { Video } from '@app/core';

describe('VideoController', () => {
  let controller: VideoController;
  let createVideoUseCase: CreateVideoUseCase;
  let getVideoUseCase: GetVideoUseCase;
  let processVideoUseCase: ProcessVideoUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [
        {
          provide: CreateVideoUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetVideoUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ProcessVideoUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VideoController>(VideoController);
    createVideoUseCase = module.get<CreateVideoUseCase>(CreateVideoUseCase);
    getVideoUseCase = module.get<GetVideoUseCase>(GetVideoUseCase);
    processVideoUseCase = module.get<ProcessVideoUseCase>(ProcessVideoUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a video and return result', async () => {
      const dto: CreateVideoDto = { title: 'Test', description: 'Desc' };
      const expectedResult = { id: '123', uploadUrl: 'http://url', key: 'key' };

      (createVideoUseCase.execute as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      const result = await controller.create(dto);

      expect(createVideoUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a video', async () => {
      const id = '123';
      const expectedResult = new Video(id, 'Test', 'Desc');

      (getVideoUseCase.execute as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(getVideoUseCase.execute).toHaveBeenCalledWith(id);
      expect(result).toBe(expectedResult);
    });
  });

  describe('process', () => {
    it('should trigger processing', async () => {
      const id = '123';
      const expectedResult = { message: 'Processing started', videoId: id };
      const req = { traceId: 'test-trace-id' } as any;

      (processVideoUseCase.execute as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      const result = await controller.process(id, req);

      expect(processVideoUseCase.execute).toHaveBeenCalledWith(
        id,
        'test-trace-id',
      );
      expect(result).toBe(expectedResult);
    });
  });
});
