import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('API_PORT') || 3000;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

  // Enable CORS
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
    allowedHeaders: 'Content-Type,Authorization,Accept,X-Requested-With,X-File-Name,X-File-Size,X-File-Type,Range',
    exposedHeaders: 'Content-Disposition,Content-Range,X-Content-Type-Options,X-Frame-Options',
    optionsSuccessStatus: 200,
  });

  app.setGlobalPrefix('v1');
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

  // Setup Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('M-Share API')
    .setDescription('M-Share Collaboration Platform API - Single User Version')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication',
      },
      'jwt',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('projects', 'Project management endpoints')
    .addTag('project-items', 'Project items endpoints')
    .addTag('project-files', 'Project files endpoints')
    .addTag('donations', 'Donation management endpoints')
    .addTag('sponsorships', 'Sponsorship management endpoints')
    .addTag('activities', 'Activity log endpoints')
    .addTag('notifications', 'Notification endpoints')
    .addTag('analytics', 'Analytics endpoints')
    .addTag('search', 'Search endpoints')
    .addTag('settings', 'Settings endpoints')
    .setContact('M-Share Team', 'https://m-share.vercel.app', 'support@m-share.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer(
      `http://localhost:${port}`,
      'Development Environment',
    )
    .addServer(
      'https://m-share-api.onrender.com',
      'Production Environment',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
      showModels: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 2,
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
    customSiteTitle: 'M-Share API Documentation - Complete Payload Reference',
  });

  await app.listen(port);

  console.log(`\n✅ M-Share API v1.0.0`);
  console.log(`✅ Environment: ${nodeEnv}`);
  console.log(`✅ Server: http://localhost:${port}`);
  console.log(`✅ Health Check: http://localhost:${port}/health`);
  console.log(`✅ API Docs: http://localhost:${port}/api/docs`);
  console.log(`✅ All endpoints ready\n`);
}

bootstrap().catch((error: Error) => {
  console.error('❌ Failed to start application:', error.message);
  process.exit(1);
});
