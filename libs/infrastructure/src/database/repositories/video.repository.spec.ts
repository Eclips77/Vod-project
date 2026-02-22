import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { VideoRepository } from './video.repository';
import { VideoStatus } from '@app/core';
import { Video } from '../schemas/video.schema';
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

const mockVideoDoc = {
  _id: '123',
  title: 'Test Video',
  description: 'Test Description',
  status: VideoStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn(),
  __v: 0,
};

describe('VideoRepository', () => {
  let repository: VideoRepository;
  let model: Model<Video>;

  beforeEach(async () => {
    class MockModel {
      save: jest.Mock;

      constructor(public data: any) {
        this.data = data;
        this.save = jest.fn().mockResolvedValue(mockVideoDoc);
      }
      static find = jest.fn();
      static findById = jest.fn();
      static findByIdAndUpdate = jest.fn();
      static findByIdAndDelete = jest.fn();
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoRepository,
        {
          provide: getModelToken(Video.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get<VideoRepository>(VideoRepository);
    model = module.get<Model<Video>>(getModelToken(Video.name));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new video', async () => {
      const videoEntity = { title: 'Test', description: 'Desc' } as any;
      const result = await repository.create(videoEntity);
      expect(result.id).toBe('123');
      expect(result.title).toBe('Test Video');
    });
  });

  describe('findAll', () => {
    it('should return an array of videos', async () => {
      const exec = jest.fn().mockResolvedValue([mockVideoDoc]);
      (model.find as jest.Mock).mockReturnValue({ exec });

      const result = await repository.findAll();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('123');
      expect(model.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find a video by id', async () => {
      const exec = jest.fn().mockResolvedValue(mockVideoDoc);
      (model.findById as jest.Mock).mockReturnValue({ exec });

      const result = await repository.findById('123');
      expect(result).toBeDefined();
      expect(result!.id).toBe('123');
      expect(model.findById).toHaveBeenCalledWith('123');
    });

    it('should return null if not found', async () => {
      const exec = jest.fn().mockResolvedValue(null);
      (model.findById as jest.Mock).mockReturnValue({ exec });

      const result = await repository.findById('999');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a video successfully', async () => {
      const videoEntity = { id: '123', title: 'New Title' } as any;
      const updatedDoc = { ...mockVideoDoc, title: 'New Title' };
      const exec = jest.fn().mockResolvedValue(updatedDoc);
      (model.findByIdAndUpdate as jest.Mock).mockReturnValue({ exec });

      const result = await repository.update(videoEntity);
      expect(result.title).toBe('New Title');
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith('123', videoEntity, { new: true });
    });

    it('should throw NotFoundException if video not found', async () => {
      const videoEntity = { id: '999' } as any;
      const exec = jest.fn().mockResolvedValue(null);
      (model.findByIdAndUpdate as jest.Mock).mockReturnValue({ exec });

      await expect(repository.update(videoEntity)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a video', async () => {
      const exec = jest.fn().mockResolvedValue(mockVideoDoc);
      (model.findByIdAndDelete as jest.Mock).mockReturnValue({ exec });

      await repository.delete('123');
      expect(model.findByIdAndDelete).toHaveBeenCalledWith('123');
    });
  });
});
