import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Thread } from './thread.entity';

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true, nullable: true })
  telegramId: string;

  @Column({ unique: true, nullable: true })
  discordId: string;

  @OneToMany(() => Thread, (thread) => thread.user)
  threads: Thread[];
}
