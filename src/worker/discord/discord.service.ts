import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Client,
  Events,
  GatewayIntentBits,
  Message,
  ChannelType,
} from 'discord.js';
import { AiService } from '../../ai/ai.service';
import { MessageClassifierService } from '../../ai/message-classifier.service';
import { InjectRepository } from '@nestjs/typeorm';
import { BotRepository } from '../../database/repository/bot.repository';
import { BotCurrentService } from '../../ai/bot-current.service';
import { Platform } from 'src/api/shared/constants/enum';

@Injectable()
export class DiscordService {
  private readonly bot: Client;
  private readonly logger = new Logger(DiscordService.name);
  private activeBot: any = null;

  constructor(
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(MessageClassifierService)
    private readonly messageClassifier: MessageClassifierService,
    @InjectRepository(BotRepository)
    private readonly botRepository: BotRepository,
    @Inject(BotCurrentService)
    private readonly botCurrentService: BotCurrentService,
  ) {
    this.bot = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });

    this.initializeBot();
  }

  private initializeBot() {
    this.bot.once(Events.ClientReady, () => {
      this.logger.log(`Bot is ready with name ${this.bot.user.tag}`);
    });

    this.bot.on(Events.MessageCreate, async (message: Message) => {
      await this.handleMessage(message);
    });

    this.bot.login(process.env.DISCORD_TOKEN);
  }

  private async getActiveBot() {
    console.log('Fetching active bot...');
    const _activeBot = await this.botRepository.findOne({
      where: { isActive: true, platform: Platform.DISCORD },
    });

    if (
      !this.activeBot ||
      this.activeBot.updated_at !== _activeBot.updated_at
    ) {
      const activeBot = await this.botRepository.findOne({
        where: { isActive: true, platform: Platform.DISCORD },
      });

      if (activeBot) {
        this.activeBot = activeBot;
        this.botCurrentService.setCurrentBotId(activeBot.id);
        // console.log('Active bot found:', activeBot);
      } else {
        console.log('No active bot found.');
      }
    }
    return this.activeBot;
  }

  private async handleMessage(message: Message) {
    console.log('Message type:', message.channel.type);
    console.log('Channel ID:', message.channel.id);
    console.log('Author ID:', message.author.id);
    console.log('Is DM:', message.channel.type === ChannelType.DM);

    if (message.author.bot) return;

    let content = message.content;
    const botMention = `<@${this.bot.user.id}>`;

    if (
      (content.startsWith('!bot') ||
        content.startsWith('/bot') ||
        message.mentions.has(this.bot.user)) &&
      content.trim().length <= 4
    ) {
      content += ' hi';
    }
    console.log('content', content);

    const activeBot = await this.getActiveBot();
    console.log('activeBot v2', activeBot);
    if (!activeBot) {
      if (message.channel.type === ChannelType.DM) {
        const thinkingMsg = await message.reply('Thinking....');
        try {
          const result = await this.aiService.agentDiscord(
            content,
            activeBot.agentInstruction,
          );
          console.log('activeBot agentInstruction', activeBot.agentInstruction);
          console.log('DM result:', result);
          await thinkingMsg.edit(result);
        } catch (error) {
          console.error('DM Error:', error);
          await thinkingMsg.edit('Sorry, an error occurred.');
        }
        return;
      }

      if (
        message.mentions.users.has(this.bot.user.id) ||
        content.startsWith('!bot') ||
        content.startsWith('/bot')
      ) {
        const thinkingMsg = await message.reply('Thinking....');
        try {
          let questionContent = content;
          if (content.startsWith('!bot')) {
            questionContent = content.slice(4).trim();
          } else if (content.startsWith('/bot')) {
            questionContent = content.slice(4).trim();
          } else if (content.includes(botMention)) {
            questionContent = content.replace(botMention, '').trim();
          }
          if (questionContent.length === 0) {
            questionContent = 'hi';
          }
          const result = await this.aiService.agentDiscord(
            questionContent,
            activeBot.agentInstruction,
          );
          await thinkingMsg.edit(result);
        } catch (error) {
          console.error('Error:', error);
          await thinkingMsg.edit('Sorry, an error occurred.');
        }
        return;
      }

      const classification =
        await this.messageClassifier.classifyMessage(content);
      console.log('classification 1', classification);

      if (classification === 'shouldRespond = true') {
        const thinkingMsg = await message.reply('Thinking....');
        try {
          const result = await this.aiService.agentDiscord(
            content,
            // activeBot.agentInstruction,
          );
          console.log('result 2', result);
          await thinkingMsg.edit(result);
        } catch (error) {
          console.error('Error:', error);
          await thinkingMsg.edit('Sorry, an error occurred.');
        }
      }
    } else {
      if (message.channel.type === ChannelType.DM) {
        const thinkingMsg = await message.reply('Thinking....');
        try {
          const result = await this.aiService.agentDiscord(
            content,
            // activeBot.agentInstruction,
          );
          await thinkingMsg.edit(result);
        } catch (error) {
          console.error('DM Error:', error);
          await thinkingMsg.edit('Sorry, an error occurred.');
        }
        return;
      }

      if (
        message.mentions.users.has(this.bot.user.id) ||
        content.startsWith('!bot') ||
        content.startsWith('/bot')
      ) {
        const thinkingMsg = await message.reply('Thinking....');
        try {
          let questionContent = content;
          if (content.startsWith('!bot')) {
            questionContent = content.slice(4).trim();
          } else if (content.startsWith('/bot')) {
            questionContent = content.slice(4).trim();
          } else if (content.includes(botMention)) {
            questionContent = content.replace(botMention, '').trim();
          }
          if (questionContent.length === 0) {
            questionContent = 'hi';
          }
          const result = await this.aiService.agentDiscord(
            questionContent,
            activeBot.agentInstruction,
          );
          console.log('result', result);
          await thinkingMsg.edit(result);
        } catch (error) {
          console.error('Error:', error);
          await thinkingMsg.edit('Sorry, an error occurred.');
        }
        return;
      }
      const classifierInstruction = activeBot.classifierInstruction;
      const formattedClassifierPrompt =
        await this.botCurrentService.formatClassifierPrompt(
          classifierInstruction,
        );

      const classification = await this.messageClassifier.classifyMessage(
        content,
        formattedClassifierPrompt,
      );
      console.log('classification 2', classification);

      if (classification === 'shouldRespond = true') {
        const thinkingMsg = await message.reply('Thinking....');
        try {
          const result = await this.aiService.agentDiscord(
            content,
            // activeBot.agentInstruction,
          );
          console.log('result 2', result);
          await thinkingMsg.edit(result);
        } catch (error) {
          console.error('Error:', error);
          await thinkingMsg.edit('Sorry, an error occurred.');
        }
      }
    }
  }
}
