import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateVideoUseCase } from '../usecases/create-video.usecase';
import { GetVideoUseCase } from '../usecases/get-video.usecase';
import { ProcessVideoUseCase } from '../usecases/process-video.usecase';
import { CreateVideoDto } from '@app/common';

@Controller('videos')
export class VideoController {
  constructor(
    private readonly createVideoUseCase: CreateVideoUseCase,
    private readonly getVideoUseCase: GetVideoUseCase,
    private readonly processVideoUseCase: ProcessVideoUseCase,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createVideoDto: CreateVideoDto) {
    return this.createVideoUseCase.execute(createVideoDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.getVideoUseCase.execute(id);
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.ACCEPTED)
  async process(@Param('id') id: string, @Req() req: Request) {
    const traceId = (req as any).traceId; // From RequestIdMiddleware
    return this.processVideoUseCase.execute(id, traceId);
  }
}
