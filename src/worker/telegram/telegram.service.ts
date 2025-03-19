import { Injectable, Logger } from '@nestjs/common';
import { AiService } from 'src/ai/ai.service';
import { UserRepository } from 'src/database/repository/user.repository';
import { ThreadRepository } from 'src/database/repository/thread.repository';
import { MessageRepository } from 'src/database/repository/message.repository';
import * as process from 'node:process';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageClassifierService } from 'src/ai/message-classifier.service';
import { Inject } from '@nestjs/common';
const TelegramBot = require('node-telegram-bot-api');

@Injectable()
export class TelegramService {
  private readonly bot: any;
  private readonly logger = new Logger(TelegramService.name);

  @InjectRepository(UserRepository)
  private readonly userRepository: UserRepository;

  @InjectRepository(ThreadRepository)
  private readonly threadRepository: ThreadRepository;

  @InjectRepository(MessageRepository)
  private readonly messageRepository: MessageRepository;

  @Inject(MessageClassifierService)
  private readonly messageClassifierService: MessageClassifierService;

  constructor(private readonly aiService: AiService) {
    const teleToken = process.env.TELEGRAM_TOKEN;
    this.bot = new TelegramBot(teleToken, {
      polling: true,
      webHook: false,
      onlyFirstMatch: true,
      request: {
        abort: false,
      },
    });

    this.initializeBot();
  }

  private initializeBot() {
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id.toString();
      this.bot.sendMessage(chatId, 'Welcome to the CS-Agent-AI!');
      await this.handleFirstMessage(chatId);
    });

    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id.toString();
      this.bot.sendMessage(
        chatId,
        'Use /newThread to start a new thread or ask a question.',
      );
    });

    this.bot.onText(/\/newThread/, async (msg) => {
      const chatId = msg.chat.id.toString();
      try {
        await this.handleNewThread(chatId);
        this.bot.sendMessage(
          chatId,
          'New thread created. You can start chatting now!',
        );
      } catch (error) {
        this.logger.error(
          `Error handling new thread for chatId ${chatId}: ${error.message}`,
        );
        this.bot.sendMessage(
          chatId,
          'Failed to create a new thread. Please try again later.',
        );
      }
    });

    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id.toString();
      const text = msg.text;

      const classifyResult =
        await this.messageClassifierService.classifyMessage(
          text,
          // formattedClassifierPrompt,
        );
      const isQuestion =
        classifyResult == 'shouldRespond = false' ? false : true;

      if (!isQuestion) {
        return;
      }

      if (!text || typeof text !== 'string' || text.startsWith('/')) {
        return;
      }

      const thinkingMessage = await this.bot.sendMessage(
        chatId,
        'Thinking....',
      );

      try {
        const result = await this.aiService.agentTelegram(text);
        const user = await this.userRepository.getUserByTelegramId(chatId);
        if (!user) {
          await this.handleFirstMessage(chatId);
        }

        const thread = await this.threadRepository.findOne({
          where: { telegramId: chatId },
          order: { created_at: 'DESC' },
        });

        if (!thread) {
          await this.handleNewThread(chatId);
        }

        await this.messageRepository.createMessage(thread.id, text, result);

        await this.bot.editMessageText(result, {
          chat_id: chatId,
          message_id: thinkingMessage.message_id,
        });
      } catch (error) {
        this.logger.error('Error processing message', error);
        await this.bot.editMessageText(
          'Sorry, something went wrong. Please try again later.',
          {
            chat_id: chatId,
            message_id: thinkingMessage.message_id,
          },
        );
      }
    });
  }

  private async handleFirstMessage(telegramId: string) {
    const existingUser =
      await this.userRepository.getUserByTelegramId(telegramId);
    if (!existingUser) {
      await this.userRepository.createUser(telegramId);
    }

    const existingThread = await this.threadRepository.findOne({
      where: { telegramId },
    });
    if (!existingThread) {
      await this.handleNewThread(telegramId);
    }
  }

  private async handleNewThread(telegramId: string) {
    try {
      await this.threadRepository.createThread(telegramId);
    } catch (error) {
      this.logger.error(
        `Failed to create new thread for telegramId ${telegramId}: ${error.message}`,
      );
      throw error;
    }
  }

  sendMessage(chatId: number, message: string) {
    this.bot.sendMessage(chatId, message);
  }
}
