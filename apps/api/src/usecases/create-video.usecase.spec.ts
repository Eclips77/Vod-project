import { Test, TestingModule } from '@nestjs/testing';
import { CreateVideoUseCase } from './create-video.usecase';
import { VideoRepository, S3Service } from '@app/infrastructure';
import { CreateVideoDto } from '@app/common';
import { Video, VideoStatus } from '@app/core';
import { InternalServerErrorException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('CreateVideoUseCase', () => {
  let useCase: CreateVideoUseCase;
  let videoRepository: jest.Mocked<VideoRepository>;
  let s3Service: jest.Mocked<S3Service>;

  const mockVideoId = 'test-video-id';
  const mockUploadUrl = 'https://s3.amazonaws.com/test-bucket/raw/test-video-id';
  const mockCreateVideoDto: CreateVideoDto = {
    title: 'Test Video',
    description: 'Test Description',
  };

  beforeEach(async () => {
    (uuidv4 as jest.Mock).mockReturnValue(mockVideoId);

    const mockVideoRepository = {
      create: jest.fn(),
    };

    const mockS3Service = {
      getPresignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateVideoUseCase,
        {
          provide: VideoRepository,
          useValue: mockVideoRepository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    useCase = module.get<CreateVideoUseCase>(CreateVideoUseCase);
    videoRepository = module.get(VideoRepository);
    s3Service = module.get(S3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully create a video and return upload info', async () => {
      videoRepository.create.mockResolvedValue({} as Video);
      s3Service.getPresignedUrl.mockResolvedValue(mockUploadUrl);

      const result = await useCase.execute(mockCreateVideoDto);

      expect(videoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockVideoId,
          title: mockCreateVideoDto.title,
          description: mockCreateVideoDto.description,
          status: VideoStatus.PENDING,
        }),
      );

      expect(s3Service.getPresignedUrl).toHaveBeenCalledWith(
        `raw/${mockVideoId}`,
        'video/mp4',
        3600,
      );

      expect(result).toEqual({
        id: mockVideoId,
        uploadUrl: mockUploadUrl,
        key: `raw/${mockVideoId}`,
      });
    });

    it('should throw InternalServerErrorException if repository fails', async () => {
      const error = new Error('Database error');
      videoRepository.create.mockRejectedValue(error);

      await expect(useCase.execute(mockCreateVideoDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(videoRepository.create).toHaveBeenCalled();
      expect(s3Service.getPresignedUrl).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if S3 fails', async () => {
      videoRepository.create.mockResolvedValue({} as Video);
      const error = new Error('S3 error');
      s3Service.getPresignedUrl.mockRejectedValue(error);

      await expect(useCase.execute(mockCreateVideoDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(videoRepository.create).toHaveBeenCalled();
      expect(s3Service.getPresignedUrl).toHaveBeenCalled();
    });
  });
});
