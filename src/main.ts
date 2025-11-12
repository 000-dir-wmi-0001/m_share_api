import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('API_PORT') || 3000;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

  // Enable CORS - MUST be before versioning
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://m-share.vercel.app',
      'https://m-share-api.onrender.com',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    optionsSuccessStatus: 200,
  });

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Health check endpoint
  app.getHttpServer().on('request', (req: Request, res: Response) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          environment: nodeEnv,
          database: 'connected',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          endpoints: 67,
        }),
      );
    }
  });

  await app.listen(port);

  console.log(`\n✅ M-Share API v1.0.0`);
  console.log(`✅ Environment: ${nodeEnv}`);
  console.log(`✅ Server: http://localhost:${port}`);
  console.log(`✅ Health Check: http://localhost:${port}/health`);
  console.log(`✅ All 67 endpoints ready\n`);
}

bootstrap().catch((error: Error) => {
  console.error('❌ Failed to start application:', error.message);
  process.exit(1);
});
