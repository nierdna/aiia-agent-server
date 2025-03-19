import {
  Injectable,
  BadRequestException,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { MessageClassifierService } from './message-classifier.service';
import { PgvectorRepository } from '../pgvector-db/repository/pgvector.repository';
import { Crawl } from '../pgvector-db/crawl/crawl';
import * as path from 'path';
import { BotRepository } from 'src/database/repository/bot.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { GetBotsQuery, ClassifierRule } from 'src/api/dtos/botSetup.dto';
import { BotCurrentService } from './bot-current.service';
import { Platform } from 'src/api/shared/constants/enum';
import * as fs from 'fs/promises';
import { mkdir } from 'fs/promises';
import * as fsSync from 'fs';

@Injectable()
export class BotSetupService implements OnApplicationBootstrap {
  private readonly TEMP_DIR: string;

  @InjectRepository(BotRepository)
  private readonly botRepository: BotRepository;

  constructor(
    private readonly aiService: AiService,
    private readonly messageClassifierService: MessageClassifierService,
    private readonly pgvectorRepository: PgvectorRepository,
    private readonly crawl: Crawl,
    private readonly botCurrentService: BotCurrentService,
  ) {
    const possibleTempDirs = [
      process.env.TEMP_DIR,
      path.join(process.cwd(), 'temp'),
      path.join(process.cwd(), 'uploads', 'temp'),
      './temp',
    ].filter(Boolean);

    for (const dir of possibleTempDirs) {
      try {
        fsSync.mkdirSync(dir, { recursive: true });
        this.TEMP_DIR = dir;
        console.log(`Using temp directory at ${this.TEMP_DIR}`);
        break;
      } catch (error) {
        console.warn(
          `Could not create temp directory at ${dir}: ${error.message}`,
        );
      }
    }

    if (!this.TEMP_DIR) {
      throw new Error('Could not create temp directory in any location');
    }
  }

  private async ensureTempDirExists() {
    try {
      await fs.access(this.TEMP_DIR);
    } catch (error) {
      try {
        await mkdir(this.TEMP_DIR, { recursive: true });
        console.log(`Recreated temp directory at ${this.TEMP_DIR}`);
      } catch (mkdirError) {
        console.error(`Failed to create temp directory: ${mkdirError.message}`);
        throw new Error(`Could not create temp directory at ${this.TEMP_DIR}`);
      }
    }
  }

  private async readFileContent(filePath: string): Promise<string | null> {
    try {
      try {
        await fs.access(filePath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.warn(`File not found: ${filePath}`);
          return null;
        }
        throw error;
      }

      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  async getBots(query: GetBotsQuery) {
    const { take = 10, page = 1, search } = query;
    const qb = this.botRepository
      .createQueryBuilder('bot')
      .select([
        'bot.id',
        'bot.name',
        'bot.agentInstruction',
        'bot.classifierInstruction',
        'bot.filePath',
        'bot.textData',
        'bot.docName',
        'bot.isActive',
        'bot.platform',
        'bot.created_at',
        'bot.updated_at',
      ]);

    if (search) {
      qb.where('bot.name ILIKE :search OR bot.agentInstruction ILIKE :search', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('bot.isActive', 'DESC').addOrderBy('bot.created_at', 'DESC');

    const count = await qb.getCount();
    qb.skip((page - 1) * take).take(take);
    const bots = await qb.getMany();

    const botsWithData = bots.map((bot) => {
      return {
        ...bot,
        filePath: bot.filePath || null,
        textData: bot.textData || null,
        status: bot.isActive ? 'active' : 'inactive',
        platformName: bot.platform || null,
        classifierInstruction: Array.isArray(bot.classifierInstruction)
          ? bot.classifierInstruction
          : JSON.parse(bot.classifierInstruction as string),
      };
    });

    return {
      bots: botsWithData,
      pagination: {
        total: count,
        page,
        take,
        totalPages: Math.ceil(count / take),
      },
    };
  }

  async setupBot(
    botId: string,
    botName: string,
    agentInstruction: string,
    classifierInstruction: ClassifierRule[],
    file?: Express.Multer.File,
    textData?: string,
  ) {
    try {
      await this.ensureTempDirExists();

      const existingBot = await this.botRepository.findOne({
        where: { id: botId },
      });

      if (existingBot) {
        throw new BadRequestException(`Bot with ID ${botId} already exists`);
      }

      let docs = [];
      let filePath = '';
      let savedTextData = null;
      const botIdCustom = botId.replace(/-/g, '_');
      const tableName = `cs_agent_${botIdCustom}`;
      await this.pgvectorRepository.createPGVectorStore(tableName);

      if (file) {
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (!['.txt', '.pdf'].includes(fileExtension)) {
          throw new BadRequestException('Only .txt and .pdf files are allowed');
        }
        const fileType = fileExtension === '.txt' ? 'txt' : 'pdf';
        const fileData = await this.crawl.processUploadedFile(file, fileType);
        docs = docs.concat(fileData.docs);
        filePath = fileData.tempFilePath;

        try {
          await fs.access(filePath);
        } catch (error) {
          console.error(`Failed to create file at ${filePath}:`, error);
          throw new BadRequestException('Failed to process uploaded file');
        }
      } else if (textData) {
        savedTextData = textData;
        const textDocs = await this.crawl.processTextData(textData);
        docs = docs.concat(textDocs);
      }

      if (docs.length > 0) {
        await this.pgvectorRepository.seedData(docs, tableName);
      }

      await this.botRepository.save({
        id: botId,
        name: botName,
        agentInstruction: agentInstruction,
        classifierInstruction: classifierInstruction,
        filePath,
        textData: savedTextData,
        docName: `bot_${botId}`,
      });

      return {
        success: true,
        message: 'Bot setup completed successfully',
        details: {
          botId,
          botName,
          agentInstruction,
          classifierInstruction,
          filePath: filePath || null,
          textData: savedTextData,
          agentPromptUpdated: true,
          classifierPromptUpdated: true,
          dataUploaded: {
            fileUploaded: !!file,
            textDataProcessed: !!textData,
            totalDocuments: docs.length,
          },
        },
      };
    } catch (error) {
      console.error('Error in setupBot:', error);
      throw error;
    }
  }

  async editBot(
    botId: string,
    botName?: string,
    agentInstruction?: string,
    classifierInstruction?: ClassifierRule[],
    file?: Express.Multer.File,
    textData?: string,
  ) {
    try {
      const existingBot = await this.botRepository.findOne({
        where: { id: botId },
      });

      if (!existingBot) {
        throw new NotFoundException(`Bot with ID ${botId} not found`);
      }

      const updatedBot = {
        id: botId,
        name: botName || existingBot.name,
        agentInstruction: agentInstruction || existingBot.agentInstruction,
        classifierInstruction:
          classifierInstruction || existingBot.classifierInstruction,
        filePath: existingBot.filePath,
        textData: existingBot.textData,
        docName: existingBot.docName,
      };

      let docs = [];
      let filePath = existingBot.filePath;
      let savedTextData = existingBot.textData;
      const botIdCustom = botId.replace(/-/g, '_');
      const tableName = `cs_agent_${botIdCustom}`;

      if (file || textData) {
        await this.pgvectorRepository.createPGVectorStore(tableName);

        if (file) {
          const fileExtension = path.extname(file.originalname).toLowerCase();
          if (!['.txt', '.pdf'].includes(fileExtension)) {
            throw new BadRequestException(
              'Only .txt and .pdf files are allowed',
            );
          }
          const fileType = fileExtension === '.txt' ? 'txt' : 'pdf';
          const fileData = await this.crawl.processUploadedFile(file, fileType);
          docs = docs.concat(fileData.docs);
          filePath = fileData.tempFilePath;
          savedTextData = null;
        } else if (textData) {
          savedTextData = textData;
          const textDocs = await this.crawl.processTextData(textData);
          docs = docs.concat(textDocs);
          filePath = null;
        }

        if (docs.length > 0) {
          await this.pgvectorRepository.seedData(docs, tableName);
        }
      }

      const savedBot = await this.botRepository.save({
        ...updatedBot,
        filePath,
        textData: savedTextData,
      });

      return {
        success: true,
        message: 'Bot edited successfully',
        details: {
          botId: savedBot.id,
          botName: savedBot.name,
          agentInstruction: savedBot.agentInstruction,
          classifierInstruction: savedBot.classifierInstruction,
          filePath: filePath || null,
          textData: savedTextData,
          agentPromptUpdated: !!agentInstruction,
          classifierPromptUpdated: !!classifierInstruction,
          dataUploaded: {
            fileUploaded: !!file,
            textDataProcessed: !!textData,
            totalDocuments: docs.length,
          },
        },
      };
    } catch (error) {
      console.error('Error in editBot:', error);
      throw error;
    }
  }

  async testBot(botId: string, question: string) {
    const bot = await this.botRepository.findOne({ where: { id: botId } });

    if (!bot) {
      throw new NotFoundException(`Bot with ID ${botId} not found`);
    }

    const agentInstruction = bot.agentInstruction;
    const classifierInstruction = bot.classifierInstruction;
    const formattedClassifierPrompt =
      await this.botCurrentService.formatClassifierPrompt(
        classifierInstruction,
      );

    try {
      this.botCurrentService.setCurrentBotId(bot.id);

      this.messageClassifierService.classifyMessage(
        question,
        formattedClassifierPrompt,
      );

      const response = await this.aiService.agentDiscord(
        question,
        agentInstruction,
      );
      return response;
    } catch (error) {
      throw new BadRequestException(`Error testing bot: ${error.message}`);
    } finally {
      this.botCurrentService.setCurrentBotId(null);
    }
  }

  async activateBot(botId: string, platform: Platform) {
    const bot = await this.botRepository.findOne({ where: { id: botId } });

    if (!bot) {
      throw new NotFoundException(`Bot with ID ${botId} not found`);
    }

    const activeBotOnPlatform = await this.botRepository.findOne({
      where: { platform: platform, isActive: true },
    });

    if (activeBotOnPlatform) {
      await this.botRepository.update(
        { id: activeBotOnPlatform.id },
        { isActive: false },
      );
    }

    await this.botRepository.update(
      { id: bot.id },
      { isActive: true, platform: platform },
    );

    this.botCurrentService.setCurrentBotId(bot.id);

    return {
      success: true,
      message: `Bot ${bot.name} has been activated successfully on platform ${platform}`,
    };
  }

  async updateAllBotsClassifierInstruction() {
    const newClassifierInstruction = [
      {
        rule: 'rule1',
        value: true,
        content: 'If the message is a question about Whales Market',
      },
      {
        rule: 'rule2',
        value: false,
        content: 'If the message is not related to Whales Market',
      },
    ];

    try {
      await this.botRepository
        .createQueryBuilder()
        .update()
        .set({ classifierInstruction: newClassifierInstruction })
        .execute();

      return {
        success: true,
        message: 'Successfully updated classifier instruction for all bots',
      };
    } catch (error) {
      console.error('Error updating classifier instructions:', error);
      throw new Error(
        `Failed to update classifier instructions: ${error.message}`,
      );
    }
  }

  async onApplicationBootstrap() {
    // const botId = uuidv4();
    // const botName = 'Whales Market';
    // const agentInstruction = `
    // Objective:
    // You are Whales's AI Intern, engaging with users on X (Twitter) to provide concise, accurate, and professional support. Your mission is to answer questions efficiently, maintain a witty tone with polite sarcasm.
    // Core Functions
    // Information Retrieval:
    // Always use the getDocumentTool first to check if the answer is available. If not, deduce or refer to other sources.
    // Points and Token Trading:
    // Points Market:
    // Points represent token allocations and convert into tokens during the TGE as per the project's schedule.
    // Pre-Market:
    // Tokens are delivered automatically post-TGE when the project releases them.
    // Staking/Unstaking $WHALES:
    // Staking:
    // Direct users to the Staking Dashboard.
    // Explain users need to connect their wallet, enter the $WHALES amount, confirm, and receive $xWHALES.
    // Unstaking:
    // Advise users to use the 'Unstake' option to convert $xWHALES back to $WHALES.
    // Troubleshooting:
    // Order Not Showing:
    // Suggest waiting a few minutes, refreshing the site, and checking again.
    // If unresolved, ask users to create a ticket on Discord with their wallet address and transaction URL, and tag a moderator.
    // Settlement Issues:
    // Recommend checking gas fees, clearing cache, verifying token amounts, or using a different browser.
    // Direct unresolved issues to Discord for support.
    // Redirect Assistance:
    // Encourage users with unresolved questions to join the Whales Market Discord server and create a ticket. Share the Discord link: https://discord.gg/whalesmarket.
    // Response Style
    // Tone: Witty, concise, and friendly with polite sarcasm.
    // Examples
    // Points/Token Delivery:
    // Question: "I bought points; when will I get my tokens?"
    // Response: "Points are token allocations waiting for their big TGE moment. Pre-Market tokens show up post-TGE. Check your project details! For help: https://discord.gg/whalesmarket."
    // Staking/Unstaking $WHALES:
    // Question: "How do I stake $WHALES?"
    // Response: "Stake $WHALES at Staking Dashboard. Connect your wallet, enter the amount, and confirm. Unstake via 'Unstake'—crypto magic!"
    // Order Issues:
    // Question: "Why isn't my order showing?"
    // Response: "Orders sometimes take a breather. Refresh the site and check again in a few minutes. If it's still missing, head to https://discord.gg/whalesmarket and create a ticket with wallet address and txn URL."
    // Create a Ticket:
    // Question: "How do I create a ticket?"
    // Response: "Easy! Create a ticket on our Discord here: https://discord.gg/whalesmarket. Tag a mod, and they'll swoop in to assist."
    // Token Comments:
    // Question: "What do you think of $PAWSY?"
    // Response: "$PAWSY or any other token? The crypto space is exciting, but every move should be informed."
    // Key Rules
    // Whales Market documentation: For questions about Whales Market documentation, please call GetDocumentTool.
    // Token information in Whales Market System: For questions related to tokens including, address, price, symbol, volume, 24h volume, vol, website, twitter, settle, please call the GetDetailTokenTool.
    // Token Whales Market (Whales) information: Please call the GetTotalRewardsTool, GetVolumeTool.
    // Be Concise and Witty: Keep responses short and engaging, with a sprinkle of humor.
    // Be Honest: Never fabricate answers; redirect unresolved issues to Discord.
    // Redirect Effectively: Always provide the Discord link for unresolved queries: https://discord.gg/whalesmarket.
    // `;
    // const classifierInstruction = `
    // [
    //   {
    //     rule: "rule1",
    //     value: false,
    //     content: "If the message is a greeting or a normal conversation",
    //   },
    //   {
    //     rule: "rule2",
    //     value: false,
    //     content: "If the message is not related to Whales Market",
    //   },
    //   {
    //     rule: "rule3",
    //     value: false,
    //     content: "If the message is a question about Whales Market",
    //   },
    //   {
    //     "rule": "rule4",
    //     "value": true,
    //     "content": "If the message is a question about token information such as: address, price, symbol, volume, 24h volume, website, twitter, settle, settlement day, or related topics",
    //   }
    // ]
    // `;
    // const textData = `
    // 1. Project Overview
    // Name: Whales Market
    // Type: Decentralized OTC DEX
    // Description: Whales Market is the ultimate OTC decentralized exchange for trading pre-listing allocations. It allows users to directly exchange assets across multiple blockchains with complete trustlessness and security.
    // Core Mission: To mitigate risks in peer-to-peer cryptocurrency trading by consolidating OTC transactions onto a secure platform. Smart contracts lock funds, releasing them only upon successful transaction settlement to prevent scams and fraud.
    // Unique Selling Point: Enables users to trade airdrop allocations even before claiming them.
    // 2. Supported Blockchains
    // Primary Token Blockchain: Solana
    // Supported Networks:
    // Solana, Ethereum, Arbitrum, BNB Chain, Optimism, zkSync, Merlin Chain, Blast, Base, Linea, Mode, Scroll, Taiko, Starknet.
    // 3. Tokenomics
    // Ticker: $WHALES
    // Total Supply: 100,000,000 tokens
    // Blockchain: Solana
    // Mint Address: GTH3wG3NErjwcf7VGCoXEXkgXSHvYhx5gtATeeM5JAS1
    // Token Allocation:
    // Incentives: 65% (65,000,000 tokens) - Linear emissions over 4 years, DAO-governed.
    // Team: 9.5% (9,500,000 tokens) - 0% TGE, locked for 9 months, linear vesting for 36 months.
    // Liquidity: 7.5% (7,500,000 tokens) - 5% burned on TGE, 2.5% reserved for CEX listing.
    // Private Sale: 7% (7,000,000 tokens) - 50% TGE, linear vesting for 2 months.
    // Airdrop: 5% (5,000,000 tokens) - 50% TGE, linear vesting for 12 months.
    // Marketing: 5% (5,000,000 tokens) - 20% TGE, linear vesting for 24 months.
    // Security: 1% (1,000,000 tokens) - 100% TGE.
    // 4. Token Utility
    // Platform fees collected are converted into $WHALES and utilized as follows:
    // Revenue-sharing: 60% of fees are redistributed to $WHALES stakers.
    // Development Expenses: 20% allocated to ongoing platform development.
    // Buyback and Burn: 10% used to repurchase and burn $WHALES, reducing circulating supply.
    // $LOOT Revenue-sharing: 10% shared with $LOOT stakers and $xLOOT holders.
    // 5. Staking
    // Overview:
    // Stake $WHALES to earn revenue generated from OTC market fees (60% distributed to stakers).
    // Staking rewards are issued in $xWHALES, which serves two functions:
    // Receive revenue share.
    // Use as collateral in OTC markets.
    // Mechanics:
    // Fees collected in various assets are converted to $WHALES and distributed.
    // Dual-Asset Pool: Includes $WHALES and $xWHALES tokens.
    // Rewards are paid incrementally to avoid post-claim dumping.
    // Stakers can withdraw $xWHALES and convert it back to $WHALES anytime.
    // Withdrawal:
    // No official liquidity pool for $xWHALES on Solana DEX; conversion guaranteed only via Whales staking.
    // Rewards do not inflate supply as $WHALES are purchased from the open market.
    // 5. Airdrop and Historical Context
    // Airdrop Program:
    // A percentage of $WHALES is retrospectively airdropped to $LOOT stakers and $xLOOT holders upon launch to ensure fair distribution.
    // LootBot Context:
    // LootBot was the first project by the Whales Market team, achieving success in 2022.
    // The $WHALES token TGE occurred 11 months and 11 days ago.
    // 6. Features
    // Pre-Markets: Trade token allocations before official Token Generation Events (TGEs).
    // Point Markets: Trade project points convertible to allocations upon TGE.
    // 7. Using Whales Market Platform
    // About Pre-Markets
    // What is Pre-Market?
    // Pre-Market is the decentralized platform for trading Pre-TGE tokens or Airdrop Allocations in a secure P2P manner.
    // How it Works:
    // Buyers deposit funds, and sellers deposit tokens or assets into smart contracts.
    // Transactions are smoothly settled within the smart contract, ensuring trustless and secure trading.
    // About Point Markets
    // What is Point Market?
    // A marketplace where users trade protocol points in exchange for tokens once they are converted post-TGE.
    // How it Works:
    // Buyers purchase protocol points, and sellers provide the points as collateral. After TGE, points are automatically converted to tokens by the platform.
    // Steps to Use Pre-Market
    // Buying Token Allocation
    // Fill an Offer-to-Sell:
    // Browse offers listed by sellers.
    // Choose a price and make a deposit.
    // Deposited funds are held in a smart contract until the settlement is finalized.
    // Create an Offer-to-Buy:
    // Set your own price and quantity terms.
    // Submit collateral as a buyer.
    // Your offer remains active until filled or manually closed.
    // Selling Token Allocation
    // Fill an Offer-to-Buy:
    // Find buy offers with suitable prices.
    // Deposit collateral to guarantee the token allocation delivery.
    // The smart contract secures collateral until tokens are delivered post-TGE.
    // Create an Offer-to-Sell:
    // Define your own price and terms for selling tokens.
    // Submit collateral to list your sell offer.
    // Offers can be partially or fully filled by buyers.
    // Steps to Use Point Market
    // Buying Protocol Points
    // Fill an Offer-to-Sell:
    // Locate an offer with a suitable price.
    // Deposit funds into the smart contract.
    // Once TGE occurs, points convert to tokens as announced by the project.
    // Create an Offer-to-Buy:
    // Set custom terms for buying points.
    // Deposit funds, and wait for sellers to fill your offer.
    // Selling Protocol Points
    // Fill an Offer-to-Buy:
    // Deposit collateral to guarantee token delivery post-conversion.
    // Once points are converted into tokens, finalize and settle the offer.
    // Create an Offer-to-Sell:
    // Define your selling terms, including price and quantity.
    // Submit collateral to secure your listing.
    // Settlement Rules
    // General Rules
    // Once tokens are released by the foundation, the settlement deadline begins, lasting 24 hours from the TGE time.
    // During the settlement phase:
    // Sellers must transfer tokens to buyers to settle orders.
    // Buyers must claim their tokens.
    // For Sellers
    // Responsibilities:
    // Sellers must settle their orders before the settlement deadline.
    // Failure to settle on time will result in the loss of their collateral, which will be transferred to the buyer as compensation.
    // Settlement Process:
    // Tokens equivalent to the buyer's deposit must be transferred.
    // Once settled, the seller's collateral will be returned, and the funds from the buyer will be released to the seller.
    // If Sellers Fail to Settle:
    // Buyers can cancel the order after the deadline.
    // The buyer's deposited funds are refunded, and the seller's collateral is forfeit as compensation to the buyer.
    // For Buyers
    // Responsibilities:
    // Buyers must wait for the TGE to receive their tokens from the seller.
    // If sellers fail to settle, buyers can initiate a cancel order to claim compensation.
    // Compensation in Case of Seller Default:
    // If the seller is overdue after the settlement deadline, buyers are entitled to:
    // A full refund of their deposit.
    // Compensation taken from the seller's collateral.
    // Points Market-Specific Rules
    // Conversion Rate Requirement:
    // The Points Market settlement depends on the project team announcing the points-to-token conversion rate.
    // Special Case - No Conversion Rate:
    // If the team fails to define the conversion rate:
    // The listing will be canceled.
    // All deposits and collateral will be fully refunded to participants.
    // No fees will be charged for the cancellation.
    // Automatic Conversion:
    // After the token is released, the platform will convert points into tokens automatically based on the announced rate.
    // Settlement Flow
    // If Seller Settles the Order:
    // Tokens are distributed to the buyer.
    // Buyer's deposit is transferred to the seller.
    // Seller's collateral is returned.
    // If Seller Disappears or Defaults:
    // Order is canceled by the buyer after the deadline.
    // Buyer's deposit is refunded.
    // Seller's collateral is transferred to the buyer as compensation.
    // Additional Notes
    // Settlement deadlines may be extended in rare cases of technical issues (e.g., network congestion or exchange listing delays).
    // Listings failing to reach a $50,000 trading volume within 24 hours of the settlement phase will be canceled, and all funds will be refunded.
    // Sellers and Buyers must wait for TGE to begin settlement or cancel orders.
    // Platform Fees
    // Closing an Offer:
    // A 0.5% fee is deducted when reclaiming collateral or deposits for the unfilled portions of an offer.
    // Settling an Order:
    // A 2.5% fee applies to the settlement amount when finalizing trades.
    // Buying Points or Tokens:
    // A 2.5% platform fee is charged on the total amount of tokens or points purchased.
    // Canceling an Order:
    // If the seller defaults, a 2.5% fee is deducted from both the buyer's deposited funds and the seller's collateral.
    // FAQs
    // What happens if nobody fills my order?
    // Unfilled orders can be closed manually from the dashboard, and deposits/collateral will be reclaimed.
    // Do I need to provide private keys to buyers?
    // No, Whales Market operates with secure smart contracts, and private keys are never shared.
    // I filled a buy offer but haven't received tokens yet. What should I do?
    // You must wait until the Token Generation Event (TGE) for tokens to be distributed.
    // 8. Official Links
    // Website: https://whales.market/
    // Dapp: https://pro.whales.market/
    // Twitter: https://twitter.com/WhalesMarket
    // Discord: https://discord.com/invite/whalesmarket
    // Telegram: https://t.me/verifyWhalesmarket
    // Dune: https://dune.com/whalesmarket/whales-market-solana
    // YouTube: https://www.youtube.com/@LootBotxWhalesMarket
    // 9. Official Platform Contract Address
    // Solana: https://solscan.io/account/GDsMbTq82sYcxPRLdQ9RHL9ZLY3HNVpXjXtCnyxpb2rQ
    // Ethereum: https://etherscan.io/address/0x1ecdb32e59e948c010a189a0798c674a2d0c6603
    // Arbitrum: https://arbiscan.io/address/0x7a560269480ef38b885526c8bbecdc4686d8bf7a
    // BNB Chain: https://bscscan.com/address/0x7a560269480ef38b885526c8bbecdc4686d8bf7a
    // Optimism: https://optimistic.etherscan.io/address/0xe3b7427c799353cfadddc1549967263952f17bd3
    // zkSync: https://era.zksync.network/address/0xe6c5f63623a2ae769dd3d505bc44d7eb21dd974b
    // Merlin Chain: https://scan.merlinchain.io/address/0x7a560269480Ef38B885526C8bBecdc4686d8bF7A
    // Blast: https://blastscan.io/address/0x7a560269480ef38b885526c8bbecdc4686d8bf7a
    // Base: https://basescan.org/address/0xdf02eeab3cdf6efe6b7cf2eb3a354dca92a23092
    // Linea: https://lineascan.build/address/0x7a560269480ef38b885526c8bbecdc4686d8bf7a
    // Mode: https://modescan.io/address/0x7a560269480Ef38B885526C8bBecdc4686d8bF7A
    // Scroll: https://scrollscan.com/address/0x7a560269480ef38b885526c8bbecdc4686d8bf7a
    // Taiko: https://taikoscan.io/address/0x7a560269480ef38b885526c8bbecdc4686d8bf7a
    // Starknet: https://starkscan.co/contract/0x04427a62f43314c0f1b171358235c04598dbc702c61a891fa1fb0cc52936cfff
    // `;
    // const setupBot = await this.setupBot(
    //   botId,
    //   botName,
    //   agentInstruction,
    //   classifierInstruction,
    //   undefined,
    //   textData,
    // );
    // console.log('setupBot: ', setupBot);
    // const activeBot = await this.activateBot(botId, Platform.X);
    // console.log('activeBot: ', activeBot);
    // console.log('updateAllBotsClassifierInstruction');
    // await this.updateAllBotsClassifierInstruction();
    // console.log('updateAllBotsClassifierInstruction: success');
  }
}
