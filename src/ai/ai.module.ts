import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { GetDocumentTool } from './tools/get-document-tool';

import { PgvectorDbModule } from '../pgvector-db/pgvector-db.module';
import { MessageClassifierService } from './message-classifier.service';
import { BotSetupService } from './bot-setup.service';
import { DatabaseModule } from 'src/database/database.module';
import { BotCurrentService } from './bot-current.service';
@Module({
  imports: [PgvectorDbModule, DatabaseModule],
  providers: [
    AiService,
    GetDocumentTool,
    MessageClassifierService,
    BotSetupService,
    BotCurrentService,
  ],
  exports: [
    AiService,
    MessageClassifierService,
    BotSetupService,
    BotCurrentService,
  ],
})
export class AiModule {}
