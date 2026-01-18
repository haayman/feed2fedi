import { Injectable, Inject, OnModuleInit, Logger } from "@nestjs/common";
import {
  Federation,
  Person,
  Accept,
  Follow,
  Create,
  Note,
} from "@fedify/fedify";
import { FEDIFY_FEDERATION } from "@fedify/nestjs";
import { EntityManager } from "@mikro-orm/core";
import { ConfigService } from '../../config/config.service.js';
import { AccountsService } from '../accounts/accounts.service.js';
import { Account } from '../accounts/entities/account.entity.js';
import { Post } from '../posts/entities/post.entity.js';
import { Follower } from '../followers/entities/follower.entity.js';
import * as crypto from "crypto";

interface ContextData {
  request: Request;
  url: URL;
}

@Injectable()
export class FederationService implements OnModuleInit {
  private readonly logger = new Logger(FederationService.name);
  private initialized = false;

  constructor(
    @Inject(FEDIFY_FEDERATION) public federation: Federation<ContextData>,
    private configService: ConfigService,
    private accountsService: AccountsService,
    private em: EntityManager,
  ) {}

  async onModuleInit() {
    if (!this.initialized) {
      await this.initialize();
      this.initialized = true;
    }
  }

  private getOrigin(): string {
    const domain = this.configService.getDomain();
    // Add protocol if not present
    if (domain.includes("://")) {
      return domain;
    }
    return `http://${domain}`;
  }

  private async initialize() {
    this.logger.log("Initializing Fedify federation");

    // Setup actor dispatcher for each account
    this.federation.setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
      this.logger.debug(`[ACTOR] Dispatcher called for identifier: ${identifier}`);

      const account = await this.accountsService.findByUsername(identifier);
      if (!account) {
        this.logger.debug(`[ACTOR] Account not found: ${identifier}`);
        return null;
      }

      this.logger.log(`[ACTOR] Returning actor profile for @${identifier}`);

      return new Person({
        id: ctx.getActorUri(identifier),
        name: account.displayName,
        summary: account.summary,
        preferredUsername: identifier,
        url: new URL("/", ctx.url),
        inbox: ctx.getInboxUri(identifier),
        outbox: ctx.getOutboxUri(identifier),
        publicKeys: (await ctx.getActorKeyPairs(identifier)).map(
          (keyPair) => keyPair.cryptographicKey,
        ),
      });
    });

    // TODO: Setup key pairs dispatcher - check Fedify API documentation
    // this.federation.setKeyPairsDispatcher(async (ctx, identifier) => {
    /*
    const account = await this.accountsService.findByUsername(identifier);
      if (!account) {
        this.logger.debug(`[KEYPAIR] Account not found: ${identifier}`);
        return [];
      }

      this.logger.debug(`[KEYPAIR] Loading key pair for @${identifier}`);

      try {
        // Convert PEM to CryptoKey
        const privateKeyPem = account.privateKey;
        const publicKeyPem = account.publicKey;

        // Import private key
        const privateKey = await crypto.subtle.importKey(
          "pkcs8",
          this.pemToBinary(privateKeyPem),
          {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
          },
          true,
          ["sign"],
        );

        // Import public key
        const publicKey = await crypto.subtle.importKey(
          "spki",
          this.pemToBinary(publicKeyPem),
          {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
          },
          true,
          ["verify"],
        );

        return [{ privateKey, publicKey }];
      } catch (error) {
        this.logger.error(
          `[KEYPAIR] Error loading key pair for @${identifier}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return [];
      }
    */
    // });

    // Setup inbox listeners
    this.federation
      .setInboxListeners("/users/{identifier}/inbox", "/inbox")
      .on(Follow, async (ctx, follow) => {
        this.logger.log(`[INBOX] Follow activity received`);

        if (
          follow.id == null ||
          follow.actorId == null ||
          follow.objectId == null
        ) {
          this.logger.warn("[INBOX] Follow activity missing required fields");
          return;
        }

        const parsed = ctx.parseUri(follow.objectId);
        if (parsed?.type !== "actor") {
          this.logger.warn("[INBOX] Follow target is not an actor");
          return;
        }

        const account = await this.accountsService.findByUsername(
          parsed.identifier,
        );
        if (!account) {
          this.logger.warn(
            `[INBOX] Account not found: ${parsed.identifier}`,
          );
          return;
        }

        const follower = await follow.getActor(ctx);
        if (!follower) {
          this.logger.warn("[INBOX] Could not fetch follower actor");
          return;
        }

        this.logger.log(
          `[INBOX] Auto-accepting follow from ${follower.preferredUsername || follower.id}`,
        );

        // Auto-accept follows
        try {
          await ctx.sendActivity(
            { identifier: parsed.identifier },
            follower,
            new Accept({
              actor: follow.objectId,
              object: follow,
            }),
          );
          this.logger.log(`[INBOX] Sent Accept activity`);

          // TODO: Store follower in database
        } catch (error) {
          this.logger.error(
            `[INBOX] Error sending Accept activity: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      });

    this.logger.log("[INIT] Fedify federation initialized successfully");
  }

  private pemToBinary(pem: string): ArrayBuffer {
    const base64 = pem
      .replace(/-----BEGIN[\w\s]+-----/g, "")
      .replace(/-----END[\w\s]+-----/g, "")
      .replace(/\s/g, "");
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async publishPost(post: Post, account: Account): Promise<void> {
    this.logger.log(`[PUBLISH] Publishing post ${post.id} for @${account.username}`);

    try {
      // Fetch all followers for this account
      const followers = await this.em.find(Follower, { account: account.id });
      this.logger.log(`[PUBLISH] Found ${followers.length} followers for @${account.username}`);
      
      if (followers.length > 0) {
        this.logger.debug(`[PUBLISH] Follower details:`);
        followers.forEach((f, i) => {
          this.logger.debug(`  [${i + 1}] Actor: ${f.actorUrl}, Inbox: ${f.inboxUrl}`);
        });
      }

      if (followers.length === 0) {
        this.logger.log(`[PUBLISH] No followers, skipping publication`);
        return;
      }

      // Create Note object with proper ActivityPub structure
      // Only include title and URL, not content
      const note = new Note({
        id: new URL(`/posts/${post.id}`, this.getOrigin()),
        attribution: new URL(`/users/${account.username}`, this.getOrigin()),
        name: post.title,
        url: post.url ? new URL(post.url) : undefined,
      });
      
      this.logger.debug(`[PUBLISH] Created Note: id=${note.id}, name="${note.name}"`);

      // Create activity
      const activity = new Create({
        actor: new URL(`/users/${account.username}`, this.getOrigin()),
        object: note,
      });
      
      this.logger.debug(`[PUBLISH] Created Create activity: actor=${activity.actorId}`);

      // Get account keypair for signing
      if (!account.publicKey || !account.privateKey) {
        throw new Error(`No keypair found for @${account.username}`);
      }

      this.logger.debug(`[PUBLISH] Account has keypair (private key length: ${account.privateKey.length} chars)`);

      // Send to all followers' inboxes
      let successCount = 0;
      for (const follower of followers) {
        try {
          if (!follower.inboxUrl) {
            this.logger.warn(`[PUBLISH] No inbox URL for follower: ${follower.actorUrl}`);
            continue;
          }

          const inboxUrl = new URL(follower.inboxUrl);
          this.logger.log(`[PUBLISH] Attempting to send activity to inbox: ${inboxUrl.toString()}`);

          // TODO: Implement actual sending via Fedify's message queue or direct HTTP POST
          // For now we log what would be sent
          this.logger.debug(`[PUBLISH] Activity JSON-LD would contain:`);
          this.logger.debug(`  - Type: Create`);
          this.logger.debug(`  - Actor: ${activity.actorId}`);
          this.logger.debug(`  - Object type: Note`);
          this.logger.debug(`  - Object URL: ${note.url}`);
          this.logger.debug(`  - Recipient (inbox): ${inboxUrl.toString()}`);
          
          successCount++;
        } catch (error) {
          this.logger.error(
            `[PUBLISH] Error processing follower ${follower.inboxUrl}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      this.logger.log(
        `[PUBLISH] Post ${post.id} activities prepared for ${successCount}/${followers.length} followers. ` +
        `Status: draft posts will be marked as 'published' by the scheduler.`
      );
    } catch (error) {
      this.logger.error(
        `[PUBLISH] Error publishing post: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
