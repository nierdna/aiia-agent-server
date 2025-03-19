import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Message } from '../entities/message.entity';
import { Thread } from '../entities/thread.entity';

export class MessageRepository extends Repository<Message> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(Message, dataSource.createEntityManager());
  }

  async getMessagesByThreadId(threadId: string) {
    try {
      return await this.createQueryBuilder('message')
        .leftJoinAndSelect('message.thread', 'thread')
        .where('message.threadId = :threadId', { threadId })
        .orderBy('message.createdAt', 'ASC')
        .getMany();
    } catch (error) {
      throw new Error(`Error fetching messages: ${error.message}`);
    }
  }

  async createMessage(threadId: string, question: string, answer?: string) {
    try {
      const thread = await this.dataSource
        .getRepository(Thread)
        .findOneBy({ id: threadId });

      if (!thread) {
        throw new Error(`Thread with threadId ${threadId} not found.`);
      }
      const message = await this.save({
        question,
        answer,
        threadId: thread.id,
        thread: thread,
      });

      return message;
    } catch (error) {
      throw new Error(`Error creating message: ${error.message}`);
    }
  }

  async updateMessageAnswer(id: string, answer: string) {
    try {
      return await this.createQueryBuilder()
        .update(Message)
        .set({ answer })
        .where('id = :id', { id })
        .execute();
    } catch (error) {
      throw new Error(`Error updating message: ${error.message}`);
    }
  }

  async deleteMessageById(id: string) {
    try {
      return await this.createQueryBuilder()
        .delete()
        .from(Message)
        .where('id = :id', { id })
        .execute();
    } catch (error) {
      throw new Error(`Error deleting message: ${error.message}`);
    }
  }
}
