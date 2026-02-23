import { Test, TestingModule } from '@nestjs/testing';
import { ProcessVideoUseCase } from './process-video.usecase';
import { VideoRepository, RabbitMQService } from '@app/infrastructure';
import { VideoStatus, Video } from '@app/core';
import { NotFoundException } from '@nestjs/common';

describe('ProcessVideoUseCase', () => {
  let useCase: ProcessVideoUseCase;
  let videoRepository: any;
  let rabbitMQService: any;

  beforeEach(async () => {
    videoRepository = {
      startProcessing: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };
    rabbitMQService = {
      sendToQueue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessVideoUseCase,
        {
          provide: VideoRepository,
          useValue: videoRepository,
        },
        {
          provide: RabbitMQService,
          useValue: rabbitMQService,
        },
      ],
    }).compile();

    useCase = module.get<ProcessVideoUseCase>(ProcessVideoUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should start processing successfully', async () => {
    const id = '123';
    const traceId = 'trace-1';
    const video = new Video(id, 'Title', 'Desc', VideoStatus.PROCESSING);

    videoRepository.startProcessing.mockResolvedValue(video);
    rabbitMQService.sendToQueue.mockResolvedValue(true);

    const result = await useCase.execute(id, traceId);

    expect(videoRepository.startProcessing).toHaveBeenCalledWith(id);
    expect(rabbitMQService.sendToQueue).toHaveBeenCalledWith(
      'video_processing',
      expect.objectContaining({ videoId: id }),
      expect.objectContaining({ traceId }),
    );
    expect(result).toEqual({
      message: 'Video processing started',
      videoId: id,
    });
  });

  it('should throw NotFoundException if video does not exist', async () => {
    const id = '123';
    const traceId = 'trace-1';

    videoRepository.startProcessing.mockResolvedValue(null);
    videoRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(id, traceId)).rejects.toThrow(
      NotFoundException,
    );
    expect(videoRepository.startProcessing).toHaveBeenCalledWith(id);
    expect(videoRepository.findById).toHaveBeenCalledWith(id);
  });

  it('should return message if already processing or completed', async () => {
    const id = '123';
    const traceId = 'trace-1';
    const video = new Video(id, 'Title', 'Desc', VideoStatus.PROCESSING);

    videoRepository.startProcessing.mockResolvedValue(null);
    videoRepository.findById.mockResolvedValue(video);

    const result = await useCase.execute(id, traceId);

    expect(videoRepository.startProcessing).toHaveBeenCalledWith(id);
    expect(videoRepository.findById).toHaveBeenCalledWith(id);
    expect(result).toEqual({
      message: 'Video is already being processed or completed',
    });
  });
});
