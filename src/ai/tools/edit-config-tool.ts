import * as z from 'zod';
import { StructuredTool } from 'langchain/tools';
import { Inject } from '@nestjs/common';
import { PgvectorRepository } from '../../pgvector-db/repository/pgvector.repository';
import { BotCurrentService } from '../bot-current.service';
import { BotRepository } from 'src/database/repository/bot.repository';

export class EditConfigTool extends StructuredTool {
  @Inject(PgvectorRepository)
  private readonly pgvectorRepository: PgvectorRepository;

  @Inject(BotCurrentService)
  private readonly botCurrentService: BotCurrentService;

  @Inject(BotRepository)
  private readonly botRepository: BotRepository;

  name = 'edit_config_tool';
  description = 'Edit config of agent.';
  objectParam = {
    agent_chat_prompt: z
      .string()
      .optional()
      .describe('The chat prompt of agent'),
    agent_chat_prompt_classifier: z
      .string()
      .optional()
      .describe('The chat prompt classifier of agent'),
    // data: z.any().optional().describe('The data of user'),
  };
  schema = z.object(this.objectParam);

  async _call(input: any) {
    const { agent_chat_prompt, agent_chat_prompt_classifier } = input;
    console.log('agent_chat_prompt', agent_chat_prompt);
    console.log('agent_chat_prompt_classifier', agent_chat_prompt_classifier);
    const botId = this.botCurrentService.getCurrentBotId();
    console.log('botId', botId);
    const chatPrompt = await this.botRepository.update(
      { id: botId },
      {
        agentInstruction: agent_chat_prompt || '',
        classifierInstruction: agent_chat_prompt_classifier || '',
      },
    );
    console.log('chatPrompt', chatPrompt);
    return 'success';
  }
}
