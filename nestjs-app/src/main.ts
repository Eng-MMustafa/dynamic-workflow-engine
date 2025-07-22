import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Debug environment variables (optional, remove in production)
  logger.log(`Environment variables: ${JSON.stringify(configService.get(''))}`);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 3000;
  const camundaBaseUrl = configService.get<string>('CAMUNDA_BASE_URL') || 'http://camunda:8080/engine-rest';

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`📊 Camunda Engine: ${camundaBaseUrl}`);
}

bootstrap();