import {
  Controller,
  Get,
  Query,
  Param,
  BadRequestException,
  Logger,
  Header,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ActivityPubService } from "./activitypub.service.js";

/**
 * WebFinger discovery endpoint
 * GET /.well-known/webfinger?resource=acct:username@domain
 */
@ApiTags("discovery")
@Controller("/.well-known")
export class WebFingerController {
  private readonly logger = new Logger(WebFingerController.name);

  constructor(private readonly activityPubService: ActivityPubService) {}

  @Get("webfinger")
  @Header("Content-Type", "application/jrd+json")
  async webfinger(@Query("resource") resource: string) {
    // Log incoming WebFinger requests
    this.logger.log(`[WEBFINGER] Incoming request: resource=${resource}`);

    // Parse resource: acct:username@domain
    if (!resource || !resource.startsWith("acct:")) {
      this.logger.warn(`[WEBFINGER] Invalid resource format: ${resource}`);
      throw new BadRequestException(
        "Invalid resource parameter. Expected format: acct:username@domain",
      );
    }

    const [username] = resource.substring(5).split("@");
    if (!username) {
      this.logger.warn(
        `[WEBFINGER] Could not extract username from: ${resource}`,
      );
      throw new BadRequestException(
        "Invalid resource parameter. Expected format: acct:username@domain",
      );
    }

    this.logger.log(`[WEBFINGER] Looking up username: ${username}`);
    const result = await this.activityPubService.getWebFinger(username);
    this.logger.log(`[WEBFINGER] Returning result for ${username}`);

    return result;
  }
}

/**
 * Actor endpoint
 * GET /@username
 */
@ApiTags("activitypub")
@Controller()
export class ActorController {
  private readonly logger = new Logger(ActorController.name);

  constructor(private readonly activityPubService: ActivityPubService) {}

  @Get("/@:username")
  @Header("Content-Type", "application/activity+json")
  async getActor(@Param("username") username: string) {
    this.logger.log(`[ACTOR] Incoming request for @${username}`);

    try {
      const actor = await this.activityPubService.getActorProfile(username);
      this.logger.log(`[ACTOR] Returning actor profile for @${username}`);
      return actor;
    } catch (error) {
      this.logger.error(
        `[ACTOR] Error fetching actor for @${username}:`,
        error,
      );
      throw error;
    }
  }
}

/**
 * Outbox endpoint
 * GET /@username/outbox
 */
@ApiTags("activitypub")
@Controller()
export class OutboxController {
  private readonly logger = new Logger(OutboxController.name);

  constructor(private readonly activityPubService: ActivityPubService) {}

  @Get("/@:username/outbox")
  @Header("Content-Type", "application/activity+json")
  async getOutbox(@Param("username") username: string) {
    this.logger.log(`[OUTBOX] Incoming request for @${username}/outbox`);

    return this.activityPubService.getOutbox(username);
  }
}

/**
 * Debug endpoint for testing ActivityPub responses
 * GET /api/debug/activitypub/:username
 */
@ApiTags("debug")
@Controller("api/debug/activitypub")
export class ActivityPubDebugController {
  private readonly logger = new Logger(ActivityPubDebugController.name);

  constructor(private readonly activityPubService: ActivityPubService) {}

  @Get(":username")
  async debugActor(@Param("username") username: string) {
    this.logger.log(`[DEBUG] Fetching debug info for @${username}`);

    try {
      const webfinger = await this.activityPubService.getWebFinger(username);
      const actor = await this.activityPubService.getActorProfile(username);

      return {
        username,
        webfinger,
        actor,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        username,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }
}
