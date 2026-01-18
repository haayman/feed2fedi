import {
  Entity,
  PrimaryKey,
  Property,
  Collection,
  OneToMany,
} from "@mikro-orm/core";
import { Post } from "../../posts/entities/post.entity.js";

@Entity({ tableName: "accounts" })
export class Account {
  @PrimaryKey({ type: "uuid" })
  id: string;

  @Property({ type: "string", unique: true })
  username: string;

  @Property({ type: "string" })
  displayName: string;

  @Property({ type: "text", nullable: true })
  summary?: string;

  @Property({ type: "string" })
  feedUrl: string;

  @Property({ type: "text", hidden: true })
  privateKey: string;

  @Property({ type: "text", hidden: true })
  publicKey: string;

  @Property({ type: "string" })
  actorUrl: string;

  @Property({ type: "boolean", default: true })
  isActive: boolean;

  @Property({ type: "date" })
  createdAt: Date;

  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date;

  @OneToMany(() => Post, (post) => post.account)
  posts = new Collection<Post>(this);

  constructor(
    id: string,
    username: string,
    displayName: string,
    feedUrl: string,
    privateKey: string,
    publicKey: string,
    actorUrl: string,
    isActive: boolean = true,
    summary?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id = id;
    this.username = username;
    this.displayName = displayName;
    this.feedUrl = feedUrl;
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.actorUrl = actorUrl;
    this.isActive = isActive;
    this.summary = summary;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}
