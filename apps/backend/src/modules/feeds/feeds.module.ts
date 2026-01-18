import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Feed } from './entities/feed.entity.js';
import { FeedsService } from './feeds.service.js';
import { FeedsController } from './feeds.controller.js';
import { RssCrawlerService } from './rss-crawler.service.js';
import { FeedCrawlerScheduler } from './feed-crawler.scheduler.js';
import { FederationModule } from '../federation/federation.module.js';

@Module({
  imports: [MikroOrmModule.forFeature([Feed]), FederationModule],
  controllers: [FeedsController],
  providers: [FeedsService, RssCrawlerService, FeedCrawlerScheduler],
  exports: [FeedsService, RssCrawlerService],
})
export class FeedsModule {}
