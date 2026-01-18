import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Ref,
} from "@mikro-orm/core";
import { v4 as uuid } from "uuid";
import { Account } from '../../accounts/entities/account.entity.js';

@Entity({ tableName: "feeds" })
export class Feed {
  @PrimaryKey({ type: "uuid" })
  id: string = uuid();

  @ManyToOne(() => Account, { ref: true })
  account!: Ref<Account>;

  @Property({ type: "string" })
  url!: string;

  @Property({ type: "string" })
  title!: string;

  @Property({ type: "text", nullable: true })
  description?: string;

  @Property({ type: "string", nullable: true })
  feedType?: string; // "rss" | "atom"

  @Property({ type: "boolean", default: true })
  isActive: boolean = true;

  @Property({ type: "date", nullable: true })
  lastFetchedAt?: Date;

  @Property({ type: "string", nullable: true })
  lastFetchError?: string;

  @Property({ type: "number", default: 3600 })
  fetchIntervalSeconds: number = 3600; // 1 hour default

  @Property({ type: "boolean", default: true })
  autoPublish: boolean = true;

  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Property({ type: "date" })
  updatedAt: Date = new Date();
}
