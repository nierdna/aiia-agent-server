// src/controllers/message.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { MessageService } from '../../database/services/message.service';
import { CreateMessageDto } from '../dtos/message.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  async createMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.createMessage(createMessageDto);
  }

  @Get('thread/:threadId')
  async getMessages(@Param('threadId') threadId: string) {
    return this.messageService.getMessagesByThreadId(threadId);
  }
}
