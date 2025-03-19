import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Thread } from './thread.entity';
import { Platform } from 'src/api/shared/constants/enum';

@Entity()
export class Message extends BaseEntity {
  @Column()
  question: string;

  @Column({ nullable: true })
  answer: string;

  @Column()
  threadId: string;

  @Column({ nullable: true, type: 'enum', enum: Platform })
  platform: Platform;

  @Column({ nullable: true })
  platform_message_id: string;

  @Column({ nullable: true })
  category: string;

  @ManyToOne(() => Thread, (thread) => thread.messages)
  @JoinColumn({ name: 'threadId', referencedColumnName: 'id' })
  thread: Thread;
}
