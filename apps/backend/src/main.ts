import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
