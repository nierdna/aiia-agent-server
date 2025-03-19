import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Thread } from '../entities/thread.entity';
import { User } from '../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

export class ThreadRepository extends Repository<Thread> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(Thread, dataSource.createEntityManager());
  }

  async getThreadsByUser(telegramId: string): Promise<Thread[]> {
    return this.createQueryBuilder('thread')
      .leftJoinAndSelect('thread.user', 'user')
      .where('user.telegramId = :telegramId', { telegramId })
      .getMany();
  }

  async getLatestThreadByUser(telegramId: string): Promise<Thread | null> {
    return this.createQueryBuilder('thread')
      .leftJoinAndSelect('thread.user', 'user')
      .where('user.telegramId = :telegramId', { telegramId })
      .orderBy('thread.createdAt', 'DESC')
      .getOne();
  }

  async createThread(telegramId: string): Promise<Thread> {
    const user = await this.dataSource
      .getRepository(User)
      .findOneBy({ telegramId });

    if (!user) {
      throw new Error('User not found');
    }

    const thread = await this.save({
      telegramId,
      user,
    });

    return thread;
  }
}
