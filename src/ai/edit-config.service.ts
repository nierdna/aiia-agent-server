import { Injectable, Inject } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { OnApplicationBootstrap } from '@nestjs/common';
import { EditConfigTool } from './tools/edit-config-tool';

@Injectable()
export class EditConfigService implements OnApplicationBootstrap {
  private model: ChatOpenAI;
  private openAIKey: string;
  private defaultEditConfigPrompt: string;

  @Inject(EditConfigTool)
  private readonly editConfigTool: EditConfigTool;

  constructor() {
    this.openAIKey = process.env.OPEN_AI_API_KEY;
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.1,
      apiKey: this.openAIKey,
    });

    this.defaultEditConfigPrompt = `
      You are an AI Edit Config. Your task is to edit the config of agent.
      `;
  }

  async editConfig(
    message?: string,
    customEditConfigPrompt: string = this.defaultEditConfigPrompt,
  ) {
    try {
      // if (customClassifierPrompt) {
      //   await this.updateClassifierPrompt(customClassifierPrompt);
      // }

      console.log('currentEditConfigPrompt', customEditConfigPrompt);

      const prompt = ChatPromptTemplate.fromMessages([
        ['system', customEditConfigPrompt],
        ['human', '{input}'],
      ]);

      const tool = [this.editConfigTool];

      const chain = this.model.bindTools(tool).pipe(prompt);
      console.log('chain', chain);

      if (!message) {
        return {
          success: true,
          message: 'Edit config prompt updated successfully',
        };
      }

      console.log('question', message);
      const response = await chain.invoke(message);

      console.log('Raw response:', response);
      return response;
    } catch (error) {
      console.error('Error in editConfig:', error);
      return error;
    }
  }

  onApplicationBootstrap() {
    // this.editConfig(
    //   'Please edit agent_chat_prompt as follows: Your name is GMAi Assistant. I have added a lot of data about the "Whales Market" for you, you will play the role of customer care, answering users questions. For all questions you have to call the getDocumentTool to check if the answer can be found there, before deducing it yourself or looking for it in other sources.',
    // );
    // console.log('EditConfigService initialized');
  }
}
