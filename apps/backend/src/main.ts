import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from './app.module.js';
import { Inject } from '@nestjs/common';
import { FEDIFY_FEDERATION, integrateFederation } from '@fedify/nestjs';
import { Federation } from '@fedify/fedify';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file BEFORE app initialization
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

console.log('[MAIN] Loaded env vars - FEDIVERSE_DOMAIN =', process.env.FEDIVERSE_DOMAIN);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    rawBody: true // Enable raw body for Fedify
  });

  // Get Fedify Federation instance
  const federation = app.get<Federation<unknown>>(FEDIFY_FEDERATION);

  // Trust proxy headers - important for reverse proxy setups
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Note: Fedify middleware is automatically applied via @fedify/nestjs
  // The routes (/.well-known/webfinger, /@username, /inbox, etc) are handled by Fedify

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  // Setup Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle("Feed2Fedi API")
    .setDescription(
      "Self-hosted Fediverse ActivityPub server with RSS feed automation",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = parseInt(process.env.PORT || "3002", 10);
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 API docs available at http://localhost:${port}/api`);
}

bootstrap();
