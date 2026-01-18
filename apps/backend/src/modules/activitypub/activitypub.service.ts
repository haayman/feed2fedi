import { Injectable, NotFoundException } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { AccountsService } from "../accounts/accounts.service.js";
import { PostsService } from "../posts/posts.service.js";
import { Post } from "../posts/entities/post.entity.js";
import { ActivityPubHelper } from "../../common/helpers/activitypub.helper.js";
import {
  Actor,
  Webfinger,
  Create,
  Collection,
} from "../../common/types/activitypub.types.js";
import { ConfigService } from "../../config/config.service.js";

@Injectable()
export class ActivityPubService {
  constructor(
    private accountsService: AccountsService,
    private postsService: PostsService,
    private configService: ConfigService,
    private em: EntityManager,
  ) {}

  /**
   * Get the ActivityPub actor profile for an account
   */
  async getActorProfile(username: string): Promise<Actor> {
    const account = await this.accountsService.findByUsername(username);
    if (!account) {
      throw new NotFoundException(`Account @${username} not found`);
    }

    const domain = this.configService.getDomain();

    // Generate favicon URL from the RSS feed URL (not from feed.haayman.nl)
    const iconUrl = account.feedUrl
      ? this.getIconUrl(account.feedUrl)
      : undefined;

    return ActivityPubHelper.createActor(
      account.username,
      domain,
      account.displayName,
      account.summary,
      account.publicKey,
      iconUrl,
    );
  }

  /**
   * Generate favicon URL from a feed URL
   * Extracts the domain from the feed URL and uses it for favicon lookup
   */
  private getIconUrl(feedUrl: string): string {
    try {
      // Parse the feed URL to extract the domain
      const url = new URL(feedUrl);
      const domain = url.hostname;
      // Use Google's favicon service for reliable favicon fetching
      return `https://www.google.com/s2/favicons?sz=256&domain=${domain}`;
    } catch (error) {
      // If URL parsing fails, return undefined (no icon)
      return undefined as any;
    }
  }

  /**
   * Get outbox (posts collection) for an account
   */
  async getOutbox(username: string): Promise<Collection> {
    const account = await this.accountsService.findByUsername(username);
    if (!account) {
      throw new NotFoundException(`Account @${username} not found`);
    }

    const domain = this.configService.getDomain();

    // Get all posts for this account
    const posts = await this.em.find(Post, { account: account.id });

    // Convert posts to Create activities
    const activities = posts.map((post) =>
      ActivityPubHelper.createActivity(
        account.username,
        domain,
        ActivityPubHelper.createNote(
          account.id,
          account.username,
          domain,
          post.title,
          post.content,
          post.url || post.id,
          post.publishedAt || new Date(),
        ),
      ),
    );

    return ActivityPubHelper.createCollection(
      account.username,
      domain,
      activities,
      activities.length,
    );
  }

  /**
   * Get WebFinger response for account discovery
   */
  async getWebFinger(username: string): Promise<Webfinger> {
    const account = await this.accountsService.findByUsername(username);
    if (!account) {
      throw new NotFoundException(`Account @${username} not found`);
    }

    const domain = this.configService.getDomain();
    return ActivityPubHelper.createWebfinger(username, domain);
  }

  /**
   * Broadcast an activity to followers
   */
  async broadcastActivity(accountId: string, activity: any): Promise<void> {
    // TODO: Implement federation/broadcasting
    // This will send the activity to followers
    console.log("Broadcasting activity:", activity);
  }
}
