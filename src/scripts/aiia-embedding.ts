import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PgvectorRepository } from '../pgvector-db/repository/pgvector.repository';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const pgvectorRepository = app.get(PgvectorRepository);
    console.log('Starting AIIA Finance document embedding process...');
    
    // Process and embed AIIA Finance documentation
    await pgvectorRepository.processAIIAFinanceDoc();
    
    console.log('AIIA Finance document embedding completed successfully!');
  } catch (error) {
    console.error('Error during document embedding process:', error);
  } finally {
    await app.close();
  }
}

bootstrap(); 