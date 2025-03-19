// src/controllers/thread.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ThreadService } from '../../database/services/thread.service';
import { CreateThreadDto } from '../dtos/thread.dto';

@Controller('threads')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Post()
  async createThread(@Body() createThreadDto: CreateThreadDto) {
    return this.threadService.createThread(createThreadDto);
  }

  @Get('user/:telegramId')
  async getThreads(@Param('telegramId') telegramId: string) {
    return this.threadService.getThreadsByUser(telegramId);
  }
}
