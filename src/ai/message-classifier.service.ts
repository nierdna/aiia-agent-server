import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class MessageClassifierService implements OnApplicationBootstrap {
  private model: ChatOpenAI;
  private openAIKey: string;
  private defaultClassifierPrompt: string;

  constructor() {
    this.openAIKey = process.env.OPEN_AI_API_KEY;
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
      apiKey: this.openAIKey,
    });

    this.defaultClassifierPrompt = `
      You are an AI message classifier. Your task is to classify whether the message is a question about AIIA Finance or not.
      
      Rules:
      1. If the message is a greeting or a normal conversation: return "shouldRespond = false"
      2. If the message is not related to AIIA Finance: return "shouldRespond = false"
      3. If the message is a question about AIIA Finance: return "shouldRespond = true"
      4. If the message is a question about blockchain technology, DeFi, or the Base network: return "shouldRespond = true"
      5. If the message is a question about AI-driven investment strategies or AI-Quant trading: return "shouldRespond = true"
      6. If the message is a question about the AIIA platform, tokenomics, or PnL Index: return "shouldRespond = true"
      7. If the message is about decentralized & trustless attributes, transparency, or independent audits: return "shouldRespond = true"
      8. If the message is about risk management, maximum drawdown, or the buy-back-and-burn program: return "shouldRespond = true"
      9. If the message is about investment position mechanism or economic model & benefits: return "shouldRespond = true"
      10. If the message is about NFT dynamics or multi-level referral: return "shouldRespond = true"
      11. If the message is about AIIA token supply, distribution, or the supply reduction policy: return "shouldRespond = true"
      12. If the message is about the total trading value limit of $10,000,000: return "shouldRespond = true"
      13. If the message is about the seed sale, founding team allocation, marketing, airdrop, or pre-sale fairlaunch: return "shouldRespond = true"
      14. If the message is about the use of raised capital, trading account, reserve fund, or on-chain account: return "shouldRespond = true"
      15. Some specific queries are related to AIIA Finance and you should return "shouldRespond = true", these are: "how to invest", "how does the PnL Index work", "what is the maximum drawdown", "how does the buy-back-and-burn program work", "what is the total trading value limit", "how does AIIA use AI for trading", "what is the token distribution", "how does the fairlaunch work", "what happens if weekly growth target is not met"
      Return ONLY "shouldRespond = true" or "shouldRespond = false". No other text or explanation needed.`;
  }

  // async updateClassifierPrompt(newPrompt: string) {
  //   if (newPrompt) {
  //     this.currentClassifierPrompt = newPrompt;
  //     return {
  //       success: true,
  //       message: 'Classifier prompt updated successfully',
  //     };
  //   }
  //   return { success: false, message: 'New prompt is required' };
  // }

  async classifyMessage(
    message?: string,
    customClassifierPrompt: string = this.defaultClassifierPrompt,
  ) {
    try {
      // if (customClassifierPrompt) {
      //   await this.updateClassifierPrompt(customClassifierPrompt);
      // }


      const prompt = ChatPromptTemplate.fromMessages([
        ['system', customClassifierPrompt],
        ['human', '{input}'],
      ]);

      const chain = prompt.pipe(this.model);

      if (!message) {
        return {
          success: true,
          message: 'Classifier prompt updated successfully',
        };
      }

      console.log('question', message);
      const response = await chain.invoke({
        input: message,
      });

      // console.log('Raw response:', response);
      return response.content;
    } catch (error) {
      console.error('Error in classifyMessage:', error);
      return 'shouldRespond = false';
    }
  }

  onApplicationBootstrap() {
    // this.classifyMessage('Hello, how are you?');
    // console.log('MessageClassifierService initialized');
  }
}
