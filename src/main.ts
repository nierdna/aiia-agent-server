import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const corsOrigin = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
  ];

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    // allowedHeaders: ['content-type'],
    origin: '*',
    // credentials: true,
  });
  const port = process.env.PORT || 3000;
  const config = new DocumentBuilder()
    .setTitle('API Documentation for AI')
    .setDescription('The API for Chatbot')
    .addBearerAuth()
    .setVersion('1.0')
    .addTag('users')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port, () => {
    console.log(`App is running in port ${port}`);
  });
}
bootstrap();
