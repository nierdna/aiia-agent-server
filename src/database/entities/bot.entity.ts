import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Platform } from 'src/api/shared/constants/enum';
import { ClassifierRule } from 'src/api/dtos/botSetup.dto';

@Entity('bots')
export class Bot extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: false })
  agentInstruction: string;

  @Column({ type: 'jsonb', nullable: true })
  classifierInstruction: ClassifierRule[];

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  docName: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true, type: 'enum', enum: Platform })
  platform: Platform;

  @Column({ type: 'text', nullable: true })
  textData: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
