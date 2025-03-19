import { BadRequestException, Injectable } from '@nestjs/common';

interface ClassifierRule {
  rule: string;
  value: boolean;
  content: string;
}

@Injectable()
export class BotCurrentService {
  private currentBotId: string = null;

  setCurrentBotId(botId: string) {
    this.currentBotId = botId;
  }

  getCurrentBotId() {
    return this.currentBotId;
  }

  async formatClassifierPrompt(
    rules: ClassifierRule[] | string,
  ): Promise<string> {
    try {
      let parsedRules: ClassifierRule[];

      if (typeof rules === 'string') {
        const cleanedString = rules
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Add double quotes to keys
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/,\s*}/g, '}') // Remove extra comma before closing brace
          .replace(/,\s*]/g, ']'); // Remove extra comma before closing bracket

        console.log('Formatted classifier prompt: ', cleanedString);

        try {
          parsedRules = JSON.parse(cleanedString);
        } catch (e) {
          console.error('JSON parse error:', e);
          try {
            parsedRules = eval(`(${cleanedString})`) as any[];
          } catch (evalError) {
            console.error('Eval parse error:', evalError);
            throw new Error(
              'Invalid rules format - cannot parse as JSON or object literal',
            );
          }
        }
      } else {
        parsedRules = rules;
      }

      if (!Array.isArray(parsedRules)) {
        throw new Error('Rules must be an array');
      }

      // Validate rule structure
      const isValidRule = (rule: any): rule is ClassifierRule => {
        return (
          typeof rule === 'object' &&
          typeof rule.rule === 'string' &&
          typeof rule.value === 'boolean' &&
          typeof rule.content === 'string'
        );
      };

      if (!parsedRules.every(isValidRule)) {
        throw new Error(
          'Invalid rule format - each rule must have required properties',
        );
      }

      const ruleLines = parsedRules.map((rule) => {
        return `${rule.content}: return "shouldRespond = ${rule.value}"`;
      });

      const numberedRules = ruleLines
        .map((line, index) => {
          return `${index + 1}. ${line}`;
        })
        .join('\n');

      const promptIntro =
        'You are an AI message classifier. Your task is to classify whether the message is a question about Whales Market or not.\n';

      return `${promptIntro}${numberedRules}\nReturn ONLY "shouldRespond = true" or "shouldRespond = false". No other text or explanation needed.`;
    } catch (error) {
      console.error('Error formatting classifier prompt:', error);
      throw new BadRequestException(
        `Invalid classifier rules format: ${error.message}`,
      );
    }
  }
}
