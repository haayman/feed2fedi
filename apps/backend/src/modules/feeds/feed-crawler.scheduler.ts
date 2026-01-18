import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CronJob } from "cron";
import { EntityManager } from "@mikro-orm/core";
import { RssCrawlerService } from "./rss-crawler.service.js";
import { FeedsService } from "./feeds.service.js";
import { Feed } from "./entities/feed.entity.js";
import { FederationService } from "../federation/fedify.service.js";
import { Account } from "../accounts/entities/account.entity.js";
import { ConfigService } from "../../config/config.service.js";

@Injectable()
export class FeedCrawlerScheduler implements OnModuleInit {
  private readonly logger = new Logger(FeedCrawlerScheduler.name);
  private cronJobs = new Map<string, CronJob>();

  constructor(
    private readonly rssCrawlerService: RssCrawlerService,
    private readonly feedsService: FeedsService,
    private readonly em: EntityManager,
    private readonly federationService: FederationService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log("[INIT] Feed crawler scheduler initializing...");

    // Give database time to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      this.logger.log("[INIT] Running initial feed crawl");
      await this.crawlFeeds();
      this.logger.log("[INIT] Initial crawl completed");
    } catch (error) {
      this.logger.error(
        `[INIT ERROR] Failed to run initial crawl: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : "",
      );
    }

    // Start cron-based crawling per account
    await this.startCronJobs();
  }

  /**
   * Start cron jobs for each account based on their crawler cron string
   */
  private async startCronJobs(): Promise<void> {
    const accounts = this.configService.getAccounts();
    this.logger.log(`[INIT] Setting up ${accounts.length} crawler cron jobs`);

    for (const account of accounts) {
      const cronString = this.configService.getAccountCrawlerCron(account.name);
      const jobName = `crawlFeed_${account.name}`;

      try {
        const job = new CronJob(cronString, async () => {
          try {
            this.logger.log(`[CRON] Crawling feed for account @${account.name}`);
            await this.crawlAccountFeeds(account.name);
          } catch (error) {
            this.logger.error(
              `[CRON ERROR] Error crawling account @${account.name}: ${error instanceof Error ? error.message : String(error)}`,
              error instanceof Error ? error.stack : "",
            );
          }
        });

        this.cronJobs.set(jobName, job);
        job.start();

        this.logger.log(
          `[CRON] Added cron job for @${account.name} with schedule: "${cronString}"`,
        );
      } catch (error) {
        this.logger.error(
          `[CRON ERROR] Failed to add cron job for account @${account.name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log(`[INIT] Cron jobs started for all accounts`);
  }

  /**
   * Crawl all feeds for a specific account
   */
  private async crawlAccountFeeds(accountName: string): Promise<void> {
    try {
      const feeds = await this.rssCrawlerService.getAccountFeeds(accountName);
      
      if (feeds.length === 0) {
        this.logger.debug(`[CRAWL] No feeds found for @${accountName}`);
        return;
      }

      this.logger.log(
        `[CRAWL] Processing ${feeds.length} feeds for @${accountName}`,
      );

      for (const feed of feeds) {
        await this.processFeed(feed);
      }

      this.logger.log(`[CRAWL] Completed crawling feeds for @${accountName}`);
    } catch (error) {
      this.logger.error(
        `[CRAWL ERROR] Error crawling feeds for @${accountName}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : "",
      );
    }
  }

  async crawlFeeds(): Promise<void> {
    try {
      this.logger.log("[CRAWL START] Starting feed crawl job");

      const feeds = await this.rssCrawlerService.getAllActiveFeeds();
      this.logger.log(`[CRAWL] Found ${feeds.length} active feeds to crawl`);

      if (feeds.length === 0) {
        this.logger.warn("[CRAWL] No active feeds found!");
        return;
      }

      for (const feed of feeds) {
        this.logger.log(`[CRAWL] Processing feed: ${feed.url}`);
        await this.processFeed(feed);
      }

      this.logger.log("[CRAWL END] Feed crawl job completed");
    } catch (error) {
      this.logger.error(
        `[CRAWL ERROR] Error in feed crawl job: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : "",
      );
    }
  }

  private async processFeed(feed: Feed): Promise<void> {
    try {
      this.logger.debug(`[PROCESS] Processing feed: ${feed.url}`);

      // Always fetch - no interval restriction on startup
      // This ensures new posts are fetched and published immediately

      // Fetch RSS feed
      this.logger.log(`[FETCH] Fetching RSS feed: ${feed.url}`);
      const items = await this.rssCrawlerService.fetchFeed(feed.url);
      this.logger.log(`[FETCH] Fetched ${items.length} items from ${feed.url}`);

      // Create posts from feed items
      this.logger.log(
        `[POSTS] Creating posts from ${items.length} items (autoPublish: ${feed.autoPublish})`,
      );
      const createdPosts =
        await this.rssCrawlerService.createPostsFromFeedItems(feed, items);
      this.logger.log(
        `[POSTS] Created ${createdPosts.length} new posts from feed ${feed.url}`,
      );

      // Publish posts if autoPublish is enabled
      if (feed.autoPublish && createdPosts.length > 0) {
        // Load full account object using its ID
        const accountId =
          feed.account instanceof Object && "id" in feed.account
            ? (feed.account as any).id
            : feed.account;
        const account = await this.em.findOne(Account, accountId);

        if (!account) {
          this.logger.error(`[PUBLISH ERROR] Account not found: ${accountId}`);
        } else {
          // Only publish draft posts, skip already published or failed ones
          const postsToPublish = createdPosts.filter(
            (p) => p.status === "draft",
          );

          if (postsToPublish.length > 0) {
            this.logger.log(
              `[PUBLISH] Publishing ${postsToPublish.length} posts for @${account.username}`,
            );
            for (const post of postsToPublish) {
              try {
                await this.federationService.publishPost(post, account);

                // Update post status to published
                post.status = "published";
                post.publishedAt = new Date();
                await this.em.persistAndFlush(post);

                this.logger.log(
                  `[PUBLISH SUCCESS] Post ${post.id} published successfully`,
                );
              } catch (error) {
                // Mark post as failed
                post.status = "failed";
                await this.em.persistAndFlush(post);

                this.logger.error(
                  `[PUBLISH ERROR] Failed to publish post ${post.id}: ${error instanceof Error ? error.message : String(error)}`,
                );
              }
            }
          } else {
            this.logger.log(
              `[PUBLISH] No draft posts to publish (${createdPosts.length} new posts already handled)`,
            );
          }
        }
      }

      // Update feed with successful fetch
      await this.rssCrawlerService.updateFeedLastFetch(feed.id);
      this.logger.log(`[SUCCESS] Feed ${feed.url} processed successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[ERROR] Error processing feed ${feed.url}: ${errorMessage}`,
        error instanceof Error ? error.stack : "",
      );

      // Update feed with error
      await this.rssCrawlerService.updateFeedLastFetch(feed.id, errorMessage);
    }
  }
}
