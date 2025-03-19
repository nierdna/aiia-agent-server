import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { Discord2Service } from './discord2.service';
@Module({
  imports: [],
  providers: [DiscordService, Discord2Service],
  exports: [DiscordService, Discord2Service],
})
export class DiscordModule {}
