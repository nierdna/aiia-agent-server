import { Module } from '@nestjs/common';
import { configDb } from './configs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Thread } from './entities/thread.entity';
import { UserRepository } from './repository/user.repository';
import { Message } from './entities/message.entity';
import { ThreadRepository } from './repository/thread.repository';
import { MessageRepository } from './repository/message.repository';
import { User } from './entities/user.entity';
import { BotRepository } from './repository/bot.repository';
import { Bot } from './entities/bot.entity';
import { AdminConfigRepository } from './repository/admin-config.repository';
import { AdminConfigEntity } from './entities/admin-config.entity';
import { TwitterPostRepository } from './repository/twitter-post.repository';
import { TwitterPostEntity } from './entities/twitter-post.entity';

const repositories = [
  UserRepository,
  ThreadRepository,
  MessageRepository,
  BotRepository,
  AdminConfigRepository,
  TwitterPostRepository,
];

const services = [];

const entities = [
  User,
  Thread,
  Message,
  Bot,
  AdminConfigEntity,
  TwitterPostEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('db'),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configDb],
    }),
  ],
  controllers: [],
  providers: [...repositories, ...services],
  exports: [...repositories, ...services],
})
export class DatabaseModule {}
