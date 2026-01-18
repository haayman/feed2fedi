import { Module, OnModuleInit, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { MikroORM } from "@mikro-orm/core";
import { SqliteDriver } from "@mikro-orm/sqlite";
import { ScheduleModule } from "@nestjs/schedule";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { PostsModule } from "./modules/posts/posts.module";
import { ActivityPubModule } from "./modules/activitypub/activitypub.module";
import { ConfigModule as AppConfigModule } from "./config/config.module";
import { ConfigService as AppConfigService } from "./config/config.service";
import { AccountsService } from "./modules/accounts/accounts.service";
import { LoggerService } from "./common/logger/logger.service";
import { HttpLoggingInterceptor } from "./common/interceptors/http-logging.interceptor";
import { APP_INTERCEPTOR } from "@nestjs/core";
import * as crypto from "crypto";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ScheduleModule.forRoot(),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        driver: SqliteDriver,
        dbName: configService.get("DB_NAME", "./data/feed2fedi.db"),
        entities: ["dist/**/*.entity.js"],
        entitiesTs: ["src/**/*.entity.ts"],
        debug: configService.get("NODE_ENV") === "development",
        allowGlobalContext: true,
        migrations: {
          disableForeignKeys: false,
        },
        knex: {
          client: "better-sqlite3",
        },
      }),
    }),
    AppConfigModule,
    AccountsModule,
    PostsModule,
    ActivityPubModule,
  ],
  providers: [
    LoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private orm: MikroORM,
    private appConfig: AppConfigService,
    private accountsService: AccountsService,
  ) {}

  async onModuleInit() {
    // Ensure database schema exists
    const generator = this.orm.getSchemaGenerator();
    await generator.ensureDatabase().catch(() => null);
    await generator.updateSchema().catch(() => null);

    // Initialize accounts from config
    const accounts = this.appConfig.getAccounts();
    const domain = this.appConfig.getDomain();

    for (const accountConfig of accounts) {
      const existing = await this.accountsService.findByUsername(
        accountConfig.name,
      );

      if (!existing) {
        const { publicKey, privateKey } = this.generateRSAKeyPair();
        const actorUrl = `http://${domain}/@${accountConfig.name}`;

        await this.accountsService.create({
          username: accountConfig.name,
          displayName: accountConfig.displayName,
          summary: accountConfig.summary,
          feedUrl: accountConfig.feedUrl,
          publicKey,
          privateKey,
          actorUrl,
        });

        console.log(`✅ Created account: @${accountConfig.name}`);
      } else {
        console.log(`⏭️  Account already exists: @${accountConfig.name}`);
      }
    }
  }

  private generateRSAKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    return { publicKey, privateKey };
  }
}
