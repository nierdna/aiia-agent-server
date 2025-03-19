import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ThreadController } from './controller/thread.controller';
import { MessageController } from './controller/message.controller';
import { ThreadRepository } from '../database/repository/thread.repository';
import { MessageRepository } from '../database/repository/message.repository';
import { MessageService } from '../database/services/message.service';
import { CustomBotController } from './controller/custom-bot.controller';
import { AiModule } from '../ai/ai.module';
import { PgvectorDbModule } from '../pgvector-db/pgvector-db.module';
import { ThreadService } from 'src/database/services/thread.service';
import { HealthController } from './controller/health.controller';
import { ConfigModule } from '@nestjs/config';
import { configAuth } from './config/auth';
import { UserController } from './controller/user.controller';
import { UserService } from 'src/database/services/user.service';
import { JwtService } from '@nestjs/jwt';
@Module({
  imports: [
    DatabaseModule,
    AiModule,
    PgvectorDbModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [
        configAuth,
        () => ({
          jwt: {
            expired_token: process.env.JWT_EXPIRED_TOKEN || 10800000,
            secret: process.env.JWT_SECRET_KEY || 'iubdfkjfljdhwnEHCGD',
          },
        }),
      ],
    }),
  ],
  controllers: [
    ThreadController,
    MessageController,
    CustomBotController,
    HealthController,
    UserController,
  ],
  providers: [ThreadService, MessageService, UserService, JwtService],
})
export class ApiModule {}
