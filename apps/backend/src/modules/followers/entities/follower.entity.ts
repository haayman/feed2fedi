import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Ref,
  Unique,
} from "@mikro-orm/core";
import { v4 as uuid } from "uuid";
import { Account } from '../../accounts/entities/account.entity.js';

@Entity({ tableName: "followers" })
@Unique({ properties: ["account", "actorUrl"] })
export class Follower {
  @PrimaryKey({ type: "uuid" })
  id: string = uuid();

  @ManyToOne(() => Account, { ref: true })
  account!: Ref<Account>;

  @Property({ type: "string" })
  actorUrl!: string; // The actor URL of the follower

  @Property({ type: "string" })
  inboxUrl!: string; // Where to send activities to this follower

  @Property({ type: "string", nullable: true })
  actorName?: string; // Display name of follower

  @Property({ type: "boolean", default: true })
  isActive: boolean = true;

  @Property({ type: "date" })
  followedAt: Date = new Date();

  @Property({ type: "date" })
  updatedAt: Date = new Date();
}
