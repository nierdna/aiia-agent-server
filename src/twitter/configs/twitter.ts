import { registerAs } from '@nestjs/config';

export const configTwitter = registerAs('twitterApi', () => ({
  secretKey: process.env.TWITTER_SECRET_KEY || '1234567890',
}));
