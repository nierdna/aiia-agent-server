import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import {
  ERequestCheckKolShilledStatus,
  ETwitterPostStatus,
} from 'src/api/shared/constants/enum';

@Entity('twitter_posts')
export class TwitterPostEntity extends BaseEntity {
  @Column({ nullable: true })
  @Index()
  character_username: string;

  @Column({ unique: true, nullable: true, type: 'bigint' })
  @Index()
  tweet_id: number;

  @Column({ nullable: true })
  bookmark_count: number;

  @Column({ nullable: true })
  conversation_id: string;

  @Column('simple-array')
  hashtags: string[];

  @Column({ nullable: true })
  html: string;

  @Column({ nullable: true })
  in_reply_to_status_id: string;

  @Column({ nullable: true })
  is_quoted: boolean;

  @Column({ nullable: true })
  is_pin: boolean;

  @Column({ nullable: true })
  is_reply: boolean;

  @Column({ nullable: true })
  is_retweet: boolean;

  @Column({ nullable: true })
  is_self_thread: boolean;

  @Column({ nullable: true })
  likes: number;

  @Column({ nullable: true })
  name: string;

  // Ex: https://twitter.com/smart_speed_ox/status/1864606928195723465
  @Column({ nullable: true })
  permanent_url: string;

  // split from permanent_url. Ex: 1864606928195723465
  @Column({ nullable: true })
  permanent_id: string;

  @Column('simple-array')
  photos: any[];

  @Column({ nullable: true })
  quoted_status_id: string;

  @Column({ nullable: true })
  replies: number;

  @Column({ nullable: true })
  retweets: number;

  @Column({ nullable: true })
  retweeted_status_id: string;

  @Column({ nullable: true })
  text: string;

  @Column('simple-array')
  thread: any[];

  @Column({ nullable: true })
  timestamp: number;

  @Column('simple-array')
  urls: any[];

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  username: string;

  @Column('simple-array')
  videos: any[];

  @Column({ nullable: true })
  views: number;

  @Column({ nullable: true })
  sensitive_content: boolean;

  @Column({
    nullable: true,
    enum: ETwitterPostStatus,
    default: ETwitterPostStatus.Init,
  })
  status: ETwitterPostStatus;

  @Column({ nullable: true })
  reply_content: string;

  @Column({ nullable: true, type: 'simple-json' })
  error_message: string;

  @Column({ nullable: true, type: 'boolean' })
  is_question: boolean;

  @Column({ nullable: true, type: 'simple-json' })
  thread_history: any[];

  @Column({ nullable: true, type: 'simple-json' })
  agent_check_question_result: any;

  @Column({
    nullable: true,
    type: 'enum',
    enum: ERequestCheckKolShilledStatus,
  })
  request_check_kol_shilled_status: ERequestCheckKolShilledStatus;

  @Column({ nullable: true })
  error_message_check_kol_shilled: string;
}
