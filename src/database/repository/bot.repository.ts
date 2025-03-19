import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Bot } from '../entities/bot.entity';

@Injectable()
export class BotRepository extends Repository<Bot> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(Bot, dataSource.createEntityManager());
  }
}
