import {
  OnApplicationBootstrap,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { QueryTweetsResponse, Scraper, SearchMode } from 'agent-twitter-client';
import { CreateTwitterUserDto } from '../dtos/create-twitter-user.dto';
import { ConfigService } from '@nestjs/config';
import { CreateTwitterUserWithCookiesDto } from '../dtos/create-twitter-user-with-cookies.dto';
import axios from 'axios';

import { Interval } from '@nestjs/schedule';
import { CreateTweetResponse } from '../interfaces/twitter.interface';
import { AiService } from 'src/ai/ai.service';
import {
  ERequestCheckKolShilledStatus,
  ETwitterPostStatus,
  Platform,
} from 'src/api/shared/constants/enum';
import { AdminConfigRepository } from 'src/database/repository/admin-config.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { TwitterPostRepository } from 'src/database/repository/twitter-post.repository';
import { MessageClassifierService } from 'src/ai/message-classifier.service';
import { BotCurrentService } from 'src/ai/bot-current.service';
import { BotRepository } from 'src/database/repository/bot.repository';

class RequestQueue {
  private queue: (() => Promise<any>)[] = [];
  private processing: boolean = false;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      try {
        await request();
      } catch (error) {
        console.error('Error processing request:', error);
        this.queue.unshift(request);
        await this.exponentialBackoff(this.queue.length);
      }
      await this.randomDelay();
    }

    this.processing = false;
  }

  private async exponentialBackoff(retryCount: number): Promise<void> {
    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async randomDelay(): Promise<void> {
    const delay = Math.floor(Math.random() * 2000) + 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

const isWorker = Boolean(Number(process.env.IS_WORKER || 0));

export class TwitterService implements OnApplicationBootstrap {
  private isRunning: boolean = false;
  private scrapers: Map<string, Scraper> = new Map();
  requestQueue: RequestQueue = new RequestQueue();
  isReady: boolean = false;

  @InjectRepository(TwitterPostRepository)
  private readonly twitterPostRepository: TwitterPostRepository;

  private activeBot: any = null;

  constructor(
    private readonly configService: ConfigService,
    @Inject(AdminConfigRepository)
    private readonly adminConfigRepository: AdminConfigRepository,
    private aiService: AiService,
    private messageClassifierService: MessageClassifierService,
    private botCurrentService: BotCurrentService,
    @InjectRepository(BotRepository)
    private readonly botRepository: BotRepository,
  ) {}
  async onApplicationBootstrap() {
    // this.handleTwitterInteractions();
    // this.aiService
    //   .generateReplyTweetv3({
    //   question: 'What did @elonmusk shill in 2024?',
    // })
    // .then((rs) => console.log('rs', rs));
  }

  private async getActiveBot() {
    console.log('Fetching active bot...');
    const _activeBot = await this.botRepository.findOne({
      where: { isActive: true, platform: Platform.X },
    });

    if (
      !this.activeBot ||
      this.activeBot.updated_at !== _activeBot.updated_at
    ) {
      const activeBot = await this.botRepository.findOne({
        where: { isActive: true, platform: Platform.X },
      });
      console.log('activeBot', activeBot);
      if (activeBot) {
        this.activeBot = activeBot;
        this.botCurrentService.setCurrentBotId(activeBot.id);
        // console.log('Active bot found:', activeBot);
      } else {
        console.log('No active bot found.');
      }
    }
    return this.activeBot;
  }

  async post(
    content?: string,
    replyToTweetId?: string,
    mediaData?: {
      data: Buffer;
      mediaType: string;
    }[],
  ): Promise<CreateTweetResponse> {
    const keys = [...this.scrapers.keys()];
    let scraper: Scraper;
    if (keys.length === 1) {
      scraper = this.scrapers.get(keys[0]);
    } else {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      scraper = this.scrapers.get(randomKey);
    }
    if (!scraper) {
      throw new Error('Scraper not found');
    }
    try {
      const rs = await scraper.sendLongTweet(
        content,
        replyToTweetId,
        mediaData,
      );
      const json = await rs.json();

      if (json.errors) {
        throw new Error(json.errors[0].message);
      }
      return json;
    } catch (error) {
      console.log(' Retry send tweet...');
      const rs = await scraper.sendTweet(content, replyToTweetId, mediaData);
      const json = await rs.json();

      if (json.errors) {
        throw new Error(json.errors[0].message);
      }
      return json;
    }
  }

  // async postWithMedia(username?: string, content?: string, media?: string) {
  //   const scraper = this.scrapers.get('404flipping');
  //   if (!scraper) {
  //     throw new Error('Scraper not found');
  //   }
  //   const image = fs.readFileSync('icon.png');

  //   // Example: Sending a tweet with media attachments
  //   const mediaData = [
  //     {
  //       data: image,
  //       mediaType: 'image/jpeg',
  //     },
  //   ];

  //   await scraper.sendTweet('Hello world!', undefined, mediaData);
  // }

  async start() {
    if (this.isReady) {
      return;
    }
    console.log('Initializing Twitter scrapers');

    const cookies = await this.adminConfigRepository.findOneByKey(
      'twitter-client-cookies',
    );

    try {
      if (cookies) {
        await this.createUserWithCookies({
          username: cookies?.data.username,
          guest_id: cookies?.data.guest_id,
          kdt: cookies?.data.kdt,
          twid: cookies?.data.twid,
          ct0: cookies?.data.ct0,
          auth_token: cookies?.data.auth_token,
        });
      }
    } catch (error) {
      console.error('Error initializing Twitter scrapers:', error);
    }

    this.isReady = true;
  }

  async createUserWithCookies(data: CreateTwitterUserWithCookiesDto) {
    try {
      // Check if username already exists
      // const existingUser = await this.twitterUserRepository.findOne({
      //   where: { username: data.username },
      // });

      // if (existingUser) {
      //   throw new ConflictException('Username already exists');
      // }

      const scraper = new Scraper({});
      const cookieStrings = [
        `guest_id=${data.guest_id}; Domain=twitter.com; Path=/; Secure; ; SameSite=none`,
        `kdt=${data.kdt}; Domain=twitter.com; Path=/; Secure; HttpOnly; SameSite=Lax`,
        `twid="u=${data.twid}"; Domain=twitter.com; Path=/; Secure; ; SameSite=none`,
        `ct0=${data.ct0}; Domain=twitter.com; Path=/; Secure; ; SameSite=lax`,
        `auth_token=${data.auth_token}; Domain=twitter.com; Path=/; Secure; HttpOnly; SameSite=none`,
        `att=1-j9tVvDhZ8SvRkTJg5vb7g43onTh2hnDxAdGSkIUO; Domain=twitter.com; Path=/; Secure; HttpOnly; SameSite=none`,
      ];

      await scraper.setCookies(cookieStrings);

      if (!(await scraper.isLoggedIn())) {
        throw new BadRequestException('Invalid cookies');
      }

      this.scrapers.set(data.username, scraper);
      console.log('Scraper created successfully');
      return true;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  private async fetchSearchTweets(
    query: string,
    maxTweets: number,
    searchMode: SearchMode,
    cursor?: string,
  ): Promise<QueryTweetsResponse> {
    if (!this.isReady) {
      await this.start();
    }
    // @dev: any key is good for search, we use a random scraper to avoid being rate limited
    const keys = [...this.scrapers.keys()];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const scraper = this.scrapers.get(randomKey);
    if (!scraper) {
      throw new Error('Scraper not found');
    }
    try {
      // Sometimes this fails because we are rate limited. in this case, we just need to return an empty array
      // if we dont get a response in 10 seconds, something is wrong
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ tweets: [] }), 10000),
      );

      try {
        const result = await this.requestQueue.add(
          async () =>
            await Promise.race([
              scraper.fetchSearchTweets(query, maxTweets, searchMode, cursor),
              timeoutPromise,
            ]),
        );
        return (result ?? { tweets: [] }) as QueryTweetsResponse;
      } catch (error) {
        return { tweets: [] };
      }
    } catch (error) {
      return { tweets: [] };
    }
  }

  async interaction() {
    const handleTwitterInteractionsLoop = async () => {
      const handles = (
        await this.adminConfigRepository.findOneByKey(
          'handle-twitter-interactions',
        )
      )?.data.handles;
      if (!handles) {
        return;
      }
      for (const handle of handles) {
        const keys = [...this.scrapers.keys()];
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const scraper = this.scrapers.get(randomKey);
        if (scraper) {
          this.crawlTwitterInteractions(handle, scraper);
        }
      }
      setTimeout(handleTwitterInteractionsLoop, 60 * 1000); // Random interval between 1 minutes
    };
    handleTwitterInteractionsLoop();
  }

  async crawlTwitterInteractions(username: string, scraper: Scraper) {
    console.log('Starting crawl twitter interactions for username:', username);
    //get username from set

    const twitterUsername = username;
    try {
      const keys = [...this.scrapers.keys()];
      const userNameTweet = keys.findIndex((key) => key == username);
      let uniqueTweetsFromUsername = [];
      // to get tweets from a specific username
      if (userNameTweet == -1) {
        const tweetsFromUsername = (
          await this.fetchSearchTweets(
            `from:${twitterUsername}`,
            10,
            SearchMode.Latest,
          )
        ).tweets;

        uniqueTweetsFromUsername = [...new Set(tweetsFromUsername)];

        uniqueTweetsFromUsername = uniqueTweetsFromUsername.map((item) => ({
          ...item,
        }));
      }

      // Check for mentions
      const tweetCandidates = (
        await this.fetchSearchTweets(
          `@${twitterUsername}`,
          20,
          SearchMode.Latest,
        )
      ).tweets;
      const profile = await scraper.getProfile(twitterUsername);
      // de-duplicate tweetCandidates with a set
      let uniqueTweetCandidates = [...new Set(tweetCandidates)];
      // console.log(tweetCandidates, 'tweetCandidates');

      // Sort tweet candidates by ID in ascending order
      uniqueTweetCandidates = uniqueTweetCandidates
        .sort((a, b) => a.id.localeCompare(b.id))
        .filter(
          (tweet) =>
            tweet.userId !== profile.userId && !keys.includes(tweet.username),
        );

      uniqueTweetCandidates = uniqueTweetCandidates.concat(
        uniqueTweetsFromUsername,
      );
      uniqueTweetCandidates = [...new Set(uniqueTweetCandidates)].sort((a, b) =>
        a.id.localeCompare(b.id),
      );

      const lastCheckedTweet =
        await this.adminConfigRepository.findOneByKey('last-checked-tweet');

      const lastCheckedTweetId = BigInt(lastCheckedTweet?.value || 0);

      const newTweets = [];
      // for each tweet candidate, handle the tweet
      for (const [index, tweet] of uniqueTweetCandidates.entries()) {
        console.log(
          `Processing tweet ${index + 1} of ${uniqueTweetCandidates.length}`,
        );
        if (!lastCheckedTweetId || BigInt(tweet.id) > lastCheckedTweetId) {
          newTweets.push({
            character_username: twitterUsername,
            tweet_id: Number(tweet.id),
            bookmark_count: tweet.bookmarkCount,
            conversation_id: tweet.conversationId,
            hashtags: tweet.hashtags,
            html: tweet.html,
            in_reply_to_status_id: tweet.inReplyToStatusId,
            is_quoted: tweet.isQuoted,
            is_pin: tweet.isPin,
            is_reply: tweet.isReply,
            is_retweet: tweet.isRetweet,
            is_self_thread: tweet.isSelfThread,
            likes: tweet.likes,
            name: tweet.name,
            mentions: tweet.mentions,
            permanent_url: tweet.permanentUrl,
            permanent_id: tweet.permanentUrl.split('/').pop(),
            photos: tweet.photos,
            quoted_status_id: tweet.quotedStatusId,
            replies: tweet.replies,
            retweets: tweet.retweets,
            retweeted_status_id: tweet.retweetedStatusId,
            text: tweet.text,
            thread: tweet.thread,
            timestamp: tweet.timestamp,
            urls: tweet.urls,
            user_id: tweet.userId,
            username: tweet.username,
            videos: tweet.videos,
            views: tweet.views,
            sensitive_content: tweet.sensitiveContent,
            status: (tweet as any)?.status
              ? ETwitterPostStatus.Success
              : ETwitterPostStatus.Init,
          });
          console.log('Saving last checked tweet ID...');

          await this.adminConfigRepository.update(
            { key: 'last-checked-tweet' },
            { value: tweet.id },
          );

          await new Promise((resolve) => setTimeout(resolve, 1000));

          console.log('Last checked tweet ID saved...');
        }
      }

      await this.twitterPostRepository.upsert(newTweets, {
        conflictPaths: ['tweet_id'],
      });
    } catch (error) {
      console.error('Error crawling Twitter interactions:', error);
    }
  }

  @Interval(1000 * 5)
  async handleTwitterInteractions() {
    if (!isWorker) {
      return;
    }
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    const debug = Number(
      (
        await this.adminConfigRepository.findOneByKey(
          'debug_mode_twitter_interaction',
        )
      )?.value || 0,
    );
    const post = await this.twitterPostRepository.findOne({
      where: {
        status: ETwitterPostStatus.Init,
      },
      order: {
        tweet_id: 'ASC',
      },
    });
    if (!post) {
      debug && console.log('No post to handle');
      this.isRunning = false;
      return;
    }

    try {
      debug &&
        console.log('Handling post', post.tweet_id, post.character_username);
      await this.twitterPostRepository.update(post.id, {
        status: ETwitterPostStatus.Processing,
      });
      debug && console.log('Updated post status to Processing');

      debug && console.log('Getting reply...');

      const content = post.text;
      const threadHistory = await this.twitterPostRepository.find({
        where: {
          conversation_id: post.conversation_id,
        },
        order: {
          timestamp: 'ASC',
        },
        select: {
          username: true,
          text: true,
          reply_content: true,
        },
      });

      const threadHistoryBuild = threadHistory.map((item) => ({
        username: item.username,
        text: item.text,
        reply_content: item.reply_content,
      }));

      // const rs = await this.post('content__2', post.permanent_id);
      // return;
      // const activeBot = await this.getActiveBot();
      // const classifierInstruction = activeBot.classifierInstruction;
      // const formattedClassifierPrompt =
      //   await this.botCurrentService.formatClassifierPrompt(
      //     classifierInstruction,
      //   );
      const classifyResult =
        await this.messageClassifierService.classifyMessage(
          content,
          // formattedClassifierPrompt,
        );
      const isQuestion =
        classifyResult == 'shouldRespond = false' ? false : true;

      const replyId =
        post.permanent_id ||
        post.permanent_url.split('/').pop() ||
        post.conversation_id;

      const updated = {
        status: ETwitterPostStatus.Success,
        thread_history: threadHistoryBuild as any,
        is_question: isQuestion,
        // agent_check_question_result: response as any,
      };

      if (!post.permanent_id) {
        updated['permanent_id'] = replyId;
      }

      if (isQuestion) {
        const response = await this.aiService.agentTwitter(
          post.text,
          // activeBot.agentInstruction,
          undefined,
          threadHistoryBuild,
        );
        updated['reply_content'] = response;
        const rs = await this.post(response, replyId);
      }

      await this.twitterPostRepository.update(post.id, updated);
      debug && console.log('Updated post status to Success');
    } catch (error) {
      await this.twitterPostRepository.update(post.id, {
        status: ETwitterPostStatus.Failed,
        error_message: error.message,
      });
      console.log('Updated post status to Failed', error);
    } finally {
      this.isRunning = false;
    }
  }
}
