// src/services/message.service.ts
import { Injectable } from '@nestjs/common';
import { MessageRepository } from '../repository/message.repository';
import { CreateMessageDto } from '../../api/dtos/message.dto';

@Injectable()
export class MessageService {
  constructor(private readonly messageRepository: MessageRepository) {}

  async createMessage(createMessageDto: CreateMessageDto) {
    return this.messageRepository.createMessage(
      createMessageDto.threadId,
      createMessageDto.question,
      createMessageDto.answer,
    );
  }

  async getMessagesByThreadId(threadId: string) {
    return this.messageRepository.getMessagesByThreadId(threadId);
  }

  async updateMessageAnswer(messageId: string, answer: string) {
    return this.messageRepository.updateMessageAnswer(messageId, answer);
  }
}
