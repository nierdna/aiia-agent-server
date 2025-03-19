import * as z from 'zod';
import { StructuredTool } from 'langchain/tools';
import { Inject } from '@nestjs/common';
import { PgvectorRepository } from '../../pgvector-db/repository/pgvector.repository';
import { BotCurrentService } from '../bot-current.service';

export class GetDocumentTool extends StructuredTool {
  @Inject(PgvectorRepository)
  private readonly pgvectorRepository: PgvectorRepository;

  @Inject(BotCurrentService)
  private readonly botCurrentService: BotCurrentService;

  name = 'get_document_tool';
  description =
    'Find information about AIIA Finance documentation such as Platform features, PnL Index, Risk Management, Tokenomics, Investment Mechanism, NFT Dynamics, Multi-level Referral, and Technical Infrastructure.';
  objectParam = {
    question: z.string().optional().describe('The question of user'),
  };
  schema = z.object(this.objectParam);

  async _call(input: any) {
    const { question } = input;
    let tableName;

    // Check if this is a query about AIIA Finance
    // if (question.toLowerCase().includes('aiia') ||
    //     question.toLowerCase().includes('pnl index') ||
    //     question.toLowerCase().includes('ai-driven') ||
    //     question.toLowerCase().includes('base network')) {
    //   // Use the dedicated AIIA Finance table
    //   tableName = 'cs_agent_aiia_finance';
    // } else {
    //   // Use the regular bot-specific table
    //   const botId = this.botCurrentService.getCurrentBotId();
    //   const botIdCustom = botId.replace(/-/g, '_');
    //   tableName = `cs_agent_${botIdCustom}`;
    // }

    tableName = 'cs_agent_aiia_finance';

    const result = await this.pgvectorRepository.search(question, tableName);
    const response = JSON.stringify(result);
    // console.log('result tool: ', response);
    return response;
  }
}
