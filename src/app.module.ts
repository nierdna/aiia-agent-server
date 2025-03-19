import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { ApiModule } from './api/api.module';
import { DatabaseModule } from './database/database.module';
import { PgvectorDbModule } from './pgvector-db/pgvector-db.module';
import { WorkerModule } from './worker/worker.module';
import { TwitterModule } from './twitter/twitter.module';

const isWorker = Boolean(Number(process.env.IS_WORKER || 0));
const isApi = Boolean(Number(process.env.IS_API || 0));
let modules = [];
if (isWorker) {
  modules = [...modules, WorkerModule];
}

if (isApi) {
  modules = [...modules, ApiModule];
}
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    PgvectorDbModule,
    TwitterModule,
    ...modules,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
