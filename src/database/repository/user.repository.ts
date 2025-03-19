import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async createUser(telegramId: string): Promise<User> {
    const user = this.create({
      telegramId,
    });

    return this.save(user);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    return this.findOne({ where: { telegramId } });
  }
}
