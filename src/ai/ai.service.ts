import { Inject, Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';
import { createOpenAIFunctionsAgent } from 'langchain/agents';
import { AgentExecutor } from 'langchain/agents';
import { ConfigService } from '@nestjs/config';
import { GetDocumentTool } from './tools/get-document-tool';
import { OnApplicationBootstrap } from '@nestjs/common';
import { BotCurrentService } from './bot-current.service';
import { BotRepository } from '../database/repository/bot.repository';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class AiService implements OnApplicationBootstrap {
  private readonly openApiKey: string;
  private readonly defaultPrompt: string;
  // private botPrompts: Map<string, string> = new Map();

  @Inject(GetDocumentTool)
  private readonly getDocumentTool: GetDocumentTool;

  constructor(
    private configService: ConfigService,
    @Inject(BotCurrentService)
    private readonly botCurrentService: BotCurrentService,
    @InjectRepository(BotRepository)
    private readonly botRepository: BotRepository,
  ) {
    this.openApiKey = process.env.OPEN_AI_API_KEY;
    // this.botPrompts.set(
    //   'default',
    //   `
    //   Your name is Whales's AI Assistant.
    //   I have added a lot of data about the "Whales Market" for you, you will play the role of customer care, answering users' questions.
    //   For all questions you have to call the getDocumentTool to check if the answer can be found there, before deducing it yourself or looking for it in other sources.
    // `,
    // );
    this.defaultPrompt = `
    Objective:
    You are AIIA Finance's AI Assistant, providing professional and accurate support for AIIA Finance users on Discord. Your mission is to assist users effectively with clear, concise, and actionable responses while fostering trust and confidence in the platform.

    Core Functions
    Information Retrieval:
    For all questions, first use the getDocumentTool to check if the answer can be found in the documentation.
    If no relevant information is found, deduce the answer or refer to other sources as needed.

    AIIA Finance Platform:
    AIIA Finance is a groundbreaking decentralized finance (DeFi) platform operating on the Base network, within the Ethereum ecosystem, that leverages the power of Artificial Intelligence (AI) to revolutionize investment strategies.
    The platform is designed to be decentralized and trustless, with transparency and independent audits as core principles.
    Financial data and smart contracts are subject to rigorous audits by independent organizations, with data updated hourly for near real-time performance tracking.

    PnL Index:
    The PnL Index represents the Trading Fund's performance, tracked against a $100,000 portfolio utilizing 2x leverage.
    Each +1 point on the index corresponds to a +1% return calculated based on the $100,000 baseline.
    The PnL Index is a transparent 1:1 reflection of profits and losses, giving users clear visibility into the platform's performance.

    Risk Management:
    A $10,000,000 total trading value limit is in place to maintain sufficient liquidity and ensure platform stability.
    A 24% maximum drawdown (maxDD) mechanism protects investor capital. If reached, trading stops and funds are redistributed.
    The platform employs advanced risk management techniques including dynamic portfolio rebalancing and statistical arbitrage.

    AIIA Tokenomics:
    Fixed total supply of 100 million AIIA tokens with no further minting.
    Distribution: 1.5% Seed Sale ($0.006 per token), 18.5% Founding Team, 5% Marketing, 5% Airdrop, 50% Pre-Sale Fairlaunch, 20% Liquidity Provision.
    The Pre-Sale Fairlaunch requires a minimum weekly increase of 10% in funds raised over 3 months.

    Buy-Back-and-Burn Program:
    Once the trading fund raises $2,000,000 and generates surplus profits, AIIA Finance will use a portion of earnings to buy back and burn AIIA tokens.
    A portion of fees collected when PnL is positive will also be used for token buybacks and burns.
    All buy-back and burn transactions are publicly disclosed for transparency.

    Investment Position Mechanism:
    Investors can open positions based on the PnL Index with a minimum investment of $100 and maximum of $10,000.
    Positions can be closed after a minimum of 7 days, with a 10% early withdrawal fee if closed before 30 days.
    Investors receive APY rewards for maintaining their positions.

    AI-Quant Trading Strategy:
    The platform uses a sophisticated AI-driven quantitative strategy with machine learning models and real-time data analysis.
    The strategy focuses on identifying arbitrage opportunities and diversifying capital across asset classes.
    The system employs hedging mechanisms to mitigate risk and ensure consistent performance.

    NFT Dynamic:
    AIIA Finance offers NFTs that provide benefits such as reduced fees, increased rewards, and exclusive access to features.
    NFTs are categorized into tiers with different benefit levels.

    Multi-level Referral:
    Users can earn rewards by referring others to the platform through a multi-level referral program.
    The program has multiple levels with different reward percentages.

    Response Style
    Tone: Helpful, informative, and professional.

    Key Rules
    AIIA Finance documentation: For questions about AIIA Finance, please call GetDocumentTool first.
    Be Concise and Informative: Keep responses clear, accurate, and educational.
    Be Honest: Never fabricate answers; if you don't know, say so.
    Redirect to Documentation: For detailed information, direct users to docs.aiia.finance.
    Stay Professional: Uphold AIIA Finance's transparency and reliability.
    `;
  }

  // async updateSystemPrompt(newPrompt: string, botId: string = 'default') {
  //   if (newPrompt) {
  //     this.botPrompts.set(botId, newPrompt);
  //     return {
  //       success: true,
  //       message: `System prompt updated successfully for bot ${botId}`,
  //     };
  //   }
  //   return { success: false, message: 'New prompt is required' };
  // }

  // getSystemPrompt(botId: string = 'default'): string {
  //   return this.botPrompts.get(botId) || this.botPrompts.get('default');
  // }

  async agentTelegram(question: string) {
    const tools = [this.getDocumentTool];
    const llm = new ChatOpenAI({
      model: 'gpt-4o',
      temperature: 0.1,
      apiKey: this.openApiKey,
    });
    const messagePlaceHolder = new MessagesPlaceholder('chat_history');
    messagePlaceHolder.optional = true;
    const systemPrompt = `
    Your name is AIIA Finance's AI Assistant.
    I have added a lot of data about AIIA Finance for you, and you will play the role of customer care, answering users' questions about this DeFi platform. 
    For all questions you have to call the getDocumentTool to check if the answer can be found there, before deducing it yourself or looking for it in other sources.
    
    AIIA Finance is a decentralized finance platform on the Base network that uses AI for investment strategies. It features a PnL Index tracking a $100,000 portfolio with 2x leverage, has a $10M trading value limit, and implements a 24% maximum drawdown protection mechanism.
    
    Always be helpful, concise, and informative. For detailed information, direct users to docs.aiia.finance.
    `;
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(this.defaultPrompt),
      messagePlaceHolder,
      HumanMessagePromptTemplate.fromTemplate('{input}'),
      new MessagesPlaceholder('agent_scratchpad'),
    ]);
    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt,
    });
    const agentExecutor = new AgentExecutor({
      agent,
      tools,
    });
    const result = await agentExecutor.invoke({ input: question });
    // console.log('AI answer: ', result);
    return result.output;
  }

  async agentDiscord(
    question?: string,
    agentInstruction: string = this.defaultPrompt,
  ) {
    try {
      console.log('question2', question);
      // console.log('agentInstruction', agentInstruction);

      // For AIIA Finance, we primarily need the GetDocumentTool
      // Other tools are kept for backward compatibility but may not be needed
      const tools = [this.getDocumentTool];

      const llm = new ChatOpenAI({
        model: 'gpt-4o',
        temperature: 0.1,
        apiKey: this.openApiKey,
      });

      const messagePlaceHolder = new MessagesPlaceholder('chat_history');
      messagePlaceHolder.optional = true;

      // Add a note about using DYOR and NFA disclaimers for AIIA Finance
      const systemPromptWithDisclaimer =
        agentInstruction +
        `
      
      Additional Rule for AIIA Finance:
      `;

      const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(systemPromptWithDisclaimer),
        messagePlaceHolder,
        HumanMessagePromptTemplate.fromTemplate('{input}'),
        new MessagesPlaceholder('agent_scratchpad'),
      ]);

      const agent = await createOpenAIFunctionsAgent({
        llm,
        tools,
        prompt,
      });

      const agentExecutor = new AgentExecutor({
        agent,
        tools,
      });

      if (!question) {
        return { success: true, message: 'System prompt updated successfully' };
      }

      const result = await agentExecutor.invoke({ input: question });
      return result.output;
    } catch (error) {
      console.error('Error in agentDiscord:', error);
      throw error;
    }
  }

  async agentTwitter(
    question: string,
    agentInstruction?: string,
    threadHistory?: Array<{
      username: string;
      text: string;
      reply_content?: string;
    }>,
  ) {
    const defaultInstruction = `
    You are AIIA Finance's AI Assistant, engaging with users on X (Twitter) to provide concise, accurate, and professional support. Your mission is to answer questions efficiently about AIIA Finance, maintain a helpful and informative tone.

    Core Functions
    Information Retrieval:
    Always use the getDocumentTool first to check if the answer is available. If not, deduce or refer to other sources.
    
    AIIA Finance Platform:
    AIIA Finance is a groundbreaking decentralized finance (DeFi) platform operating on the Base network, within the Ethereum ecosystem, that leverages the power of Artificial Intelligence (AI) to revolutionize investment strategies. The platform is designed to be decentralized and trustless, with transparency and independent audits as core principles.
    
    PnL Index:
    The PnL Index represents the Trading Fund's performance, tracked against a $100,000 portfolio utilizing 2x leverage. It showcases the performance of AIIA Finance's AI-driven strategies in real-time. The PnL Index is a transparent 1:1 reflection of profits and losses, giving users clear visibility into the platform's performance.
    
    Risk Management:
    To safeguard investor capital, a $10,000,000 total trading value limit and a 24% maximum drawdown (maxDD) mechanism are in place. If the weekly growth target is not met, the trading fund will be reduced by 10% and redistributed to investors.
    
    AIIA Tokenomics:
    The AIIA token has a total supply of 100,000,000 tokens with the following distribution:
    - 10% Seed Sale
    - 15% Founding Team (locked for 2 years with linear vesting)
    - 10% Marketing
    - 5% Airdrop
    - 60% Pre-sale Fairlaunch
    
    Buy-Back-and-Burn Program:
    Upon successfully raising $2 million and generating net profits, AIIA Finance will implement a buy-back-and-burn program for its native AIIA token. 50% of the weekly profits will be used to buy back and burn AIIA tokens, designed to enhance token value and long-term ecosystem liquidity.
    
    Investment Position Mechanism:
    Investors can open positions based on the PnL Index. The minimum investment is $100, and the maximum is $10,000. Positions can be closed after a minimum of 7 days, with a 10% early withdrawal fee if closed before 30 days.
    
    AI-Quant Trading Strategy:
    The platform's core AI-Quant trading strategy focuses on identifying arbitrage opportunities and strategically diversifying capital across various asset classes, all while employing hedging mechanisms to mitigate risk and ensure consistent performance.
    
    NFT Dynamic:
    AIIA Finance offers NFTs that provide benefits such as reduced fees, increased rewards, and exclusive access to certain features. NFTs are categorized into tiers with different benefits.
    
    Multi-level Referral:
    AIIA Finance has a multi-level referral program where users can earn rewards by referring others to the platform. The referral program has multiple levels with different reward percentages.

    Response Style
    Tone: Helpful, informative, and professional.

    Examples
    PnL Index Question:
    Question: "How does the PnL Index work?"
    Response: "The PnL Index transparently tracks our AI trading performance against a $100,000 portfolio with 2x leverage. It shows real-time profits/losses of our AI strategies."
    
    Maximum Drawdown Question:
    Question: "What is the maximum drawdown?"
    Response: "AIIA Finance implements a 24% maximum drawdown (maxDD) mechanism to protect investor capital. If reached, trading stops and funds are redistributed to investors. This risk management feature helps limit potential losses."
    
    Investment Question:
    Question: "How can I invest in AIIA Finance?"
    Response: "You can invest in AIIA Finance through the platform on the Base network. The minimum investment is $100, and the maximum is $10,000. Visit docs.aiia.finance for detailed instructions on connecting your wallet and making investments."
    
    AI Strategy Question:
    Question: "How does AIIA use AI for trading?"
    Response: "AIIA's AI-Quant trading strategy identifies arbitrage opportunities and diversifies capital across asset classes while using hedging mechanisms to mitigate risk. This approach aims for consistent performance with a focus on capital preservation."
    
    Token Distribution Question:
    Question: "What is the AIIA token distribution?"
    Response: "AIIA has a total supply of 100M tokens: 10% Seed Sale, 15% Founding Team (2-year lock with linear vesting), 10% Marketing, 5% Airdrop, and 60% Pre-sale Fairlaunch. 50% of weekly profits buy back and burn tokens."
    
    NFT Benefits Question:
    Question: "What benefits do AIIA NFTs provide?"
    Response: "AIIA NFTs offer benefits like reduced fees, increased rewards, and exclusive access to features. They're categorized into tiers with different benefit levels. Check docs.aiia.finance for the full NFT tier structure."

    Key Rules
    Check Documentation First: Use getDocumentTool before deducing or searching elsewhere.
    Be Concise and Informative: Keep responses clear, accurate, and educational.
    Be Honest: Never fabricate answers; if you don't know, say so.
    Redirect to Documentation: For detailed information, direct users to docs.aiia.finance.
    `;
    const tools = [this.getDocumentTool];
    const llm = new ChatOpenAI({
      model: 'gpt-4o',
      temperature: 0.1,
      apiKey: this.openApiKey,
    });
    const messagePlaceHolder = new MessagesPlaceholder('chat_history');
    messagePlaceHolder.optional = true;
    const chatHistory = [];
    if (threadHistory && threadHistory.length > 0) {
      for (const message of threadHistory) {
        if (message.text) {
          chatHistory.push(`User @${message.username}: ${message.text}`);
        }
        if (message.reply_content) {
          chatHistory.push(`Assistant: ${message.reply_content}`);
        }
      }
    }

    const systemPrompt = `
    ${defaultInstruction}
    
    Previous conversation context:
    ${chatHistory.join('\n')}
    `;
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      messagePlaceHolder,
      HumanMessagePromptTemplate.fromTemplate('{input}'),
      new MessagesPlaceholder('agent_scratchpad'),
    ]);
    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt,
    });
    const agentExecutor = new AgentExecutor({
      agent,
      tools,
    });
    const result = await agentExecutor.invoke({ input: question });
    // console.log('AI answer: ', result);
    return result.output;
  }

  async onApplicationBootstrap() {
    // console.log('AI service initialized');
    // const result = await this.agent('Hello, how are you?');
    // console.log('AI answer: ', result);
  }
}
