import { registerAs } from '@nestjs/config';

export const configAuth = registerAs('auth', () => ({
  key: {
    jwt_secret_key: process.env.JWT_SECRET_KEY || 'jwt-secret',
  },
  time: {
    access_token_lifetime: 60 * 60 * 24 * 7,
  },
}));
