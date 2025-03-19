import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configTwitter } from './configs';
import { TwitterService } from './services/twitter.service';
import { TwitterController } from './controllers';
import { ScheduleModule } from '@nestjs/schedule';
import { AiModule } from 'src/ai/ai.module';
import { DatabaseModule } from 'src/database/database.module';

const isWorker = Boolean(Number(process.env.IS_WORKER || 0));
const services = [TwitterService];

@Module({
  imports: [
    DatabaseModule,
    AiModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configTwitter],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [TwitterController],
  providers: [...services],
  exports: [...services],
})
export class TwitterModule implements OnApplicationBootstrap {
  constructor(private readonly twitterService: TwitterService) {}
  async onApplicationBootstrap() {
    await this.twitterService.start();
    if (isWorker) {
      await this.twitterService.interaction();
    }
  }
}
