import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from 'src/api/api.module';
import { DiscordModule } from './discord/discord.module';
import { TelegramModule } from './telegram/telegram.module';
import { AiModule } from 'src/ai/ai.module';
import { TelegramService } from './telegram/telegram.service';
import { DiscordService } from './discord/discord.service';
import { DatabaseModule } from 'src/database/database.module';
import { Discord2Service } from './discord/discord2.service';

let consumers = [];
let schedulers = [];
let services = [TelegramService, Discord2Service];
@Module({
  imports: [
    ApiModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // TelegramModule,
    // DiscordModule,
    AiModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [...consumers, ...schedulers, ...services],
})
export class WorkerModule {}
