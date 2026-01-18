import { Entity, PrimaryKey, Property, ManyToOne, Ref } from "@mikro-orm/core";
import { v4 as uuid } from "uuid";
import { Account } from "../../accounts/entities/account.entity";

@Entity({ tableName: "posts" })
export class Post {
  @PrimaryKey({ type: "uuid" })
  id: string = uuid();

  @ManyToOne(() => Account, { ref: true })
  account!: Ref<Account>;

  @Property({ type: "string" })
  externalId!: string;

  @Property({ type: "string" })
  title!: string;

  @Property({ type: "text" })
  content!: string;

  @Property({ type: "string", nullable: true })
  url?: string;

  @Property({ type: "string", nullable: true })
  authorName?: string;

  @Property({ type: "string", default: "draft" })
  status: "draft" | "published" | "failed" = "draft";

  @Property({ type: "string", nullable: true })
  activityPubUrl?: string;

  @Property({ type: "date", nullable: true })
  publishedAt?: Date;

  @Property({ type: "date" })
  createdAt: Date = new Date();

  @Property({ type: "date" })
  updatedAt: Date = new Date();
}
