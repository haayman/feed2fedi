import { Injectable, Logger } from "@nestjs/common";
import Parser from "rss-parser";
import { EntityManager } from "@mikro-orm/core";
import { Feed } from "./entities/feed.entity.js";
import { Post } from "../posts/entities/post.entity.js";
import { v4 as uuid } from "uuid";

export interface RSSItem {
  title?: string;
  content?: string;
  link?: string;
  author?: string;
  pubDate?: string;
  guid?: string;
  image?: string;
}

@Injectable()
export class RssCrawlerService {
  private readonly logger = new Logger(RssCrawlerService.name);
  private parser: Parser;

  constructor(private readonly em: EntityManager) {
    this.parser = new Parser({
      customFields: {
        item: [
          ["content:encoded", "content"],
          ["media:content", "mediaContent"],
          ["media:thumbnail", "mediaThumbnail"],
          ["image", "image"],
        ],
      },
    });
  }

  async fetchFeed(feedUrl: string): Promise<RSSItem[]> {
    try {
      this.logger.log(`[PARSER] Fetching feed from: ${feedUrl}`);
      const feed = await this.parser.parseURL(feedUrl);
      this.logger.debug(`[PARSER] Feed title: ${feed.title}`);
      this.logger.debug(`[PARSER] Feed has ${feed.items?.length || 0} items`);

      if (!feed.items || feed.items.length === 0) {
        this.logger.warn(`[PARSER] No items found in feed: ${feedUrl}`);
        return [];
      }

      const items = feed.items.map((item) => ({
        title: item.title || "Untitled",
        content: item.content || item.description || "",
        link: item.link,
        author: item.author || item.creator,
        pubDate: item.pubDate,
        guid: item.guid || item.link || uuid(),
        image: this.extractImageUrl(item),
      }));

      this.logger.log(
        `[PARSER] Parsed ${items.length} items from feed: ${feedUrl}`,
      );
      return items;
    } catch (error) {
      this.logger.error(
        `[PARSER ERROR] Error fetching feed ${feedUrl}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : "",
      );
      throw error;
    }
  }

  async createPostsFromFeedItems(
    feed: Feed,
    items: RSSItem[],
  ): Promise<Post[]> {
    const createdPosts: Post[] = [];

    for (const item of items) {
      try {
        // Check if post already exists
        const existingPost = await this.em.findOne(Post, {
          externalId: item.guid,
          account: feed.account,
        });

        if (existingPost) {
          this.logger.debug(`Post already exists: ${item.guid}`);
          continue;
        }

        const post = new Post();
        post.id = uuid();
        post.account = feed.account;
        post.externalId = item.guid || "";
        post.title = item.title || "Untitled";
        post.content = item.content || "";
        post.url = item.link;
        post.imageUrl = item.image;
        post.authorName = item.author;
        post.status = "draft"; // Will be marked as "published" after successful ActivityPub publication
        post.publishedAt = undefined; // Will be set after successful publication
        post.createdAt = item.pubDate ? new Date(item.pubDate) : new Date();
        post.updatedAt = new Date();

        this.em.persist(post);
        createdPosts.push(post);
        this.logger.debug(
          `Created post: ${post.id} from feed item: ${item.guid}`,
        );
      } catch (error) {
        this.logger.error(
          `Error creating post from feed item: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (createdPosts.length > 0) {
      await this.em.flush();
      this.logger.log(
        `Created ${createdPosts.length} posts from feed: ${feed.url}`,
      );
    }

    return createdPosts;
  }

  async getAllActiveFeeds(): Promise<Feed[]> {
    try {
      const feeds = await this.em.find(Feed, { isActive: true });
      this.logger.log(`[DB] Found ${feeds.length} active feeds in database`);
      feeds.forEach((feed, index) => {
        this.logger.debug(
          `[DB] Feed ${index + 1}: ${feed.title} (${feed.url})`,
        );
      });
      return feeds;
    } catch (error) {
      this.logger.error(
        `[DB ERROR] Error fetching active feeds: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async updateFeedLastFetch(feedId: string, error?: string): Promise<void> {
    const feed = await this.em.findOne(Feed, { id: feedId });
    if (feed) {
      feed.lastFetchedAt = new Date();
      if (error) {
        feed.lastFetchError = error;
      } else {
        feed.lastFetchError = undefined;
      }
      await this.em.flush();
    }
  }

  private extractImageUrl(item: any): string | undefined {
    // Try media:content first
    if (item.mediaContent) {
      const mediaUrl = Array.isArray(item.mediaContent)
        ? item.mediaContent[0]?.["$"]?.url
        : item.mediaContent["$"]?.url;
      if (mediaUrl) return mediaUrl;
    }

    // Try media:thumbnail
    if (item.mediaThumbnail) {
      const thumbUrl = Array.isArray(item.mediaThumbnail)
        ? item.mediaThumbnail[0]?.["$"]?.url
        : item.mediaThumbnail["$"]?.url;
      if (thumbUrl) return thumbUrl;
    }

    // Try image tag
    if (item.image) {
      return typeof item.image === "string"
        ? item.image
        : item.image.url || item.image;
    }

    // Try to extract from content (look for img tag)
    if (item.content) {
      const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
    }

    return undefined;
  }
}
