import { Module, OnModuleInit, Global, Inject } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { MikroORM } from "@mikro-orm/core";
import { SqliteDriver } from "@mikro-orm/sqlite";
import { ScheduleModule } from "@nestjs/schedule";
import { AccountsModule } from "./modules/accounts/accounts.module.js";
import { PostsModule } from "./modules/posts/posts.module.js";
import { ActivityPubModule } from "./modules/activitypub/activitypub.module.js";
import { FeedsModule } from "./modules/feeds/feeds.module.js";
import { FederationModule } from "./modules/federation/federation.module.js";
import { ConfigModule as AppConfigModule } from "./config/config.module.js";
import { ConfigService as AppConfigService } from "./config/config.service.js";
import { AccountsService } from "./modules/accounts/accounts.service.js";
import { FeedsService } from "./modules/feeds/feeds.service.js";
import { Feed } from "./modules/feeds/entities/feed.entity.js";
import { LoggerService } from "./common/logger/logger.service.js";
import { HttpLoggingInterceptor } from "./common/interceptors/http-logging.interceptor.js";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { FEDIFY_FEDERATION, integrateFederation } from "@fedify/nestjs";
import { Federation } from "@fedify/fedify";
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
        debug: false,
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
    FederationModule,
    AccountsModule,
    PostsModule,
    ActivityPubModule,
    FeedsModule,
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
    private feedsService: FeedsService,
    @Inject(FEDIFY_FEDERATION) private federation: Federation<unknown>,
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

      // Create feed for this account if it doesn't exist
      const account = await this.accountsService.findByUsername(
        accountConfig.name,
      );

      if (account) {
        const existingFeed = await this.orm.em.findOne(Feed, {
          account: account.id,
        });

        if (!existingFeed && accountConfig.feedUrl) {
          try {
            await this.feedsService.create({
              accountId: account.id,
              url: accountConfig.feedUrl,
              title: accountConfig.displayName,
              description: accountConfig.summary,
              autoPublish: true,
            });
            console.log(
              `✅ Created feed for @${accountConfig.name}: ${accountConfig.feedUrl}`,
            );
          } catch (error) {
            console.error(
              `❌ Failed to create feed for @${accountConfig.name}:`,
              error,
            );
          }
        } else if (existingFeed) {
          console.log(`⏭️  Feed already exists for @${accountConfig.name}`);
        }
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
