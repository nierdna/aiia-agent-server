import { DataSource } from 'typeorm';
import { configDb } from './configs';
import { config } from 'dotenv';

config();

const dbConfig = configDb();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'test',
  synchronize: true,
  logging: Boolean(Number(process.env.DB_DEBUG)) || false,
  entities: ['dist/database/entities/*.js'],
  migrations: ['dist/database/migrations/*.js'],
  migrationsRun: true,
});
