import { Entity, ManyToOne, OneToMany, Column, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity()
export class Thread extends BaseEntity {
  @Column()
  userId: string;

  @Column({ nullable: true, unique: true })
  threadId: string;

  @Column({ nullable: true, unique: true })
  telegramId: string;

  @ManyToOne(() => User, (user) => user.threads)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Message, (message) => message.thread)
  messages: Message[];

  // @CreateDateColumn({ name: 'created_thread_at' })
  // createdThreadAt: Date;
}
