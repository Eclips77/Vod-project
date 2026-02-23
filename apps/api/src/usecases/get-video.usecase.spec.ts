import { Test, TestingModule } from '@nestjs/testing';
import { GetVideoUseCase } from './get-video.usecase';
import { VideoRepository } from '@app/infrastructure';
import { Video, VideoStatus } from '@app/core';
import { NotFoundException } from '@nestjs/common';

describe('GetVideoUseCase', () => {
  let useCase: GetVideoUseCase;
  let videoRepository: Partial<Record<keyof VideoRepository, jest.Mock>>;

  beforeEach(async () => {
    videoRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVideoUseCase,
        {
          provide: VideoRepository,
          useValue: videoRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetVideoUseCase>(GetVideoUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return a video if found', async () => {
    const video = new Video(
      '123',
      'Test Title',
      'Test Description',
      VideoStatus.PENDING,
      'http://original-url.com',
      'http://processed-url.com',
      new Date(),
      new Date(),
    );
    videoRepository.findById!.mockResolvedValue(video);

    const result = await useCase.execute('123');
    expect(result).toBe(video);
    expect(videoRepository.findById).toHaveBeenCalledWith('123');
  });

  it('should throw NotFoundException if video not found', async () => {
    videoRepository.findById!.mockResolvedValue(null);

    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
    expect(videoRepository.findById).toHaveBeenCalledWith('999');
  });
});
