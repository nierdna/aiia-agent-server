import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { AiModule } from 'src/ai/ai.module';
import { AiService } from 'src/ai/ai.service';

@Module({
  imports: [],
  providers: [TelegramService, AiService],
  exports: [TelegramService],
})
export class TelegramModule {}
