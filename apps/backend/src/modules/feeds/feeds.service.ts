import { Injectable, Logger } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { Feed } from './entities/feed.entity.js';
import { v4 as uuid } from "uuid";

export interface CreateFeedDto {
  accountId: string;
  url: string;
  title: string;
  description?: string;
  fetchIntervalSeconds?: number;
  autoPublish?: boolean;
}

export interface UpdateFeedDto {
  title?: string;
  description?: string;
  isActive?: boolean;
  fetchIntervalSeconds?: number;
  autoPublish?: boolean;
}

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);

  constructor(private readonly em: EntityManager) {}

  async create(createFeedDto: CreateFeedDto): Promise<Feed> {
    const feed = new Feed();
    feed.id = uuid();
    feed.account = { id: createFeedDto.accountId } as any;
    feed.url = createFeedDto.url;
    feed.title = createFeedDto.title;
    feed.description = createFeedDto.description;
    feed.fetchIntervalSeconds = createFeedDto.fetchIntervalSeconds || 3600;
    feed.autoPublish = createFeedDto.autoPublish ?? true;
    feed.isActive = true;

    this.em.persist(feed);
    await this.em.flush();

    this.logger.log(`Created feed: ${feed.id} - ${feed.url}`);
    return feed;
  }

  async findAll(): Promise<Feed[]> {
    return this.em.find(Feed, {});
  }

  async findByAccountId(accountId: string): Promise<Feed[]> {
    return this.em.find(Feed, { account: accountId });
  }

  async findOne(id: string): Promise<Feed | null> {
    return this.em.findOne(Feed, { id });
  }

  async update(id: string, updateFeedDto: UpdateFeedDto): Promise<Feed> {
    const feed = await this.em.findOne(Feed, { id });
    if (!feed) {
      throw new Error(`Feed with id ${id} not found`);
    }

    Object.assign(feed, updateFeedDto);
    await this.em.flush();

    this.logger.log(`Updated feed: ${id}`);
    return feed;
  }

  async remove(id: string): Promise<void> {
    const feed = await this.em.findOne(Feed, { id });
    if (feed) {
      this.em.remove(feed);
      await this.em.flush();
      this.logger.log(`Removed feed: ${id}`);
    }
  }
}
