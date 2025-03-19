// src/services/thread.service.ts
import { Injectable } from '@nestjs/common';
import { ThreadRepository } from '../repository/thread.repository';
import { CreateThreadDto } from '../../api/dtos/thread.dto';

@Injectable()
export class ThreadService {
  constructor(private readonly threadRepository: ThreadRepository) {}

  async createThread(createThreadDto: CreateThreadDto) {
    return this.threadRepository.createThread(createThreadDto.telegramId);
  }

  async getThreadsByUser(telegramId: string) {
    return this.threadRepository.getThreadsByUser(telegramId);
  }
}
