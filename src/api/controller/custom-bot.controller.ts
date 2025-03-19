import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from '../../ai/ai.service';
import { MessageClassifierService } from '../../ai/message-classifier.service';
import { PgvectorRepository } from '../../pgvector-db/repository/pgvector.repository';
import { Crawl } from '../../pgvector-db/crawl/crawl';
import * as path from 'path';
import { BotSetupService } from '../../ai/bot-setup.service';
import { BotSetupDto, FileQuery, GetBotsQuery } from '../dtos/botSetup.dto';
import { BotEditDto } from '../dtos/botEdit.dto';
import { createReadStream } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';
import { Response } from 'express';
import { TestBotDto } from '../dtos/testBot.dto';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActivateBotDto } from '../dtos/activateBot.dto';

@Controller('custom-bot')
export class CustomBotController {
  constructor(
    private readonly botSetupService: BotSetupService,
    private readonly aiService: AiService,
    private readonly messageClassifierService: MessageClassifierService,
    private readonly pgvectorRepository: PgvectorRepository,
    private readonly crawl: Crawl,
  ) {}

  //   @Post('discord-agent-chat')
  //   async handleDiscordMessage(@Body() body: AgentDiscordDto) {
  //     const { question } = body;
  //     if (!question) {
  //       throw new BadRequestException('Question is required');
  //     }
  //     return this.aiService.agentDiscord(question);
  //   }

  //   @Post('discord-agent-instruction')
  //   async handleDiscordInstruction(@Body() body: AgentDiscordInstructionDto) {
  //     const { systemPrompt } = body;
  //     if (!systemPrompt) {
  //       throw new BadRequestException('System prompt is required');
  //     }
  //     return this.aiService.agentDiscord(null, systemPrompt);
  //   }

  //   @Post('classify-message-agent-instruction')
  //   async classifyMessage(@Body() body: AgentDiscordInstructionDto) {
  //     const { systemPrompt } = body;
  //     if (!systemPrompt) {
  //       throw new BadRequestException('System prompt is required');
  //     }
  //     return this.messageClassifierService.classifyMessage(null, systemPrompt);
  //   }

  //   @Post('upload')
  //   @UseInterceptors(FileInterceptor('file'))
  //   @ApiConsumes('multipart/form-data')
  //   @ApiBody({ type: FileUploadDto })
  //   async uploadFile(
  //     @UploadedFile(
  //       new ParseFilePipe({
  //         validators: [
  //           new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
  //         ],
  //       }),
  //     )
  //     file: Express.Multer.File,
  //   ) {
  //     await this.pgvectorRepository.createPGVectorStore();
  //     const fileExtension = path.extname(file.originalname).toLowerCase();
  //     if (!['.txt', '.pdf'].includes(fileExtension)) {
  //       throw new BadRequestException('Only .txt and .pdf files are allowed');
  //     }

  //     const fileType = fileExtension === '.txt' ? 'txt' : 'pdf';
  //     const docs = await this.crawl.processUploadedFile(file, fileType);
  //     const result = await this.pgvectorRepository.seedData(docs);
  //     return result;
  //   }

  @Post('setup-and-replace-bot')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: BotSetupDto })
  async setupBot(
    @Body()
    body: BotSetupDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const { botName, agentInstruction, classifierInstruction, textData } = body;

    const botId = uuidv4();

    if (!botName || !botId || !agentInstruction || !classifierInstruction) {
      throw new BadRequestException(
        'Bot name, bot ID, agent instruction and classifier instruction are required',
      );
    }

    if (!file && !textData) {
      throw new BadRequestException(
        'At least one type of data (file or text) is required',
      );
    }

    return this.botSetupService.setupBot(
      botId,
      botName,
      agentInstruction,
      classifierInstruction,
      file,
      textData,
    );
  }

  @Get('file')
  async getFile(
    @Query() query: FileQuery,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = join(query.filePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    const fileType = path.extname(filePath).toLowerCase();
    const mimeType = fileType === '.txt' ? 'text/plain' : 'application/pdf';
    const fileName = path.basename(filePath);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    const fileStream = createReadStream(filePath);

    fileStream.pipe(res);
  }

  @Get('bots')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getBots(@Query() query: GetBotsQuery) {
    return this.botSetupService.getBots(query);
  }
  @Post('edit-bot')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: BotEditDto })
  async editBot(
    @Body()
    body: BotEditDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const {
      botId,
      botName,
      agentInstruction,
      classifierInstruction,
      textData,
    } = body;

    if (!botId) {
      throw new BadRequestException('Bot ID is required');
    }

    return this.botSetupService.editBot(
      botId,
      botName,
      agentInstruction,
      classifierInstruction,
      file,
      textData,
    );
  }

  @Post('test-bot')
  async testBot(@Body() body: TestBotDto) {
    const { botId, question } = body;

    if (!botId || !question) {
      throw new BadRequestException('Bot ID and question are required');
    }

    return this.botSetupService.testBot(botId, question);
  }

  @Post('activate-bot')
  async activateBot(@Body() body: ActivateBotDto) {
    const { botId, platform } = body;

    if (!botId || !platform) {
      throw new BadRequestException('Bot ID and platform are required');
    }

    return this.botSetupService.activateBot(botId, platform);
  }
}
