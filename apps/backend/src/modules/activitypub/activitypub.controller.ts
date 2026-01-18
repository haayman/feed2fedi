import { Controller, Get, Query, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ActivityPubService } from './activitypub.service.js';

/**
 * WebFinger discovery endpoint
 * GET /.well-known/webfinger?resource=acct:username@domain
 */
@ApiTags("discovery")
@Controller("/.well-known")
export class WebFingerController {
  constructor(private readonly activityPubService: ActivityPubService) {}

  @Get("webfinger")
  async webfinger(@Query("resource") resource: string) {
    // Parse resource: acct:username@domain
    if (!resource || !resource.startsWith("acct:")) {
      throw new Error("Invalid resource");
    }

    const [username] = resource.substring(5).split("@");
    return this.activityPubService.getWebFinger(username);
  }
}

/**
 * Actor endpoint
 * GET /@username
 */
@ApiTags("activitypub")
@Controller()
export class ActorController {
  constructor(private readonly activityPubService: ActivityPubService) {}

  @Get("/@:username")
  async getActor(@Param("username") username: string) {
    return this.activityPubService.getActorProfile(username);
  }
}

/**
 * Outbox endpoint
 * GET /@username/outbox
 */
@ApiTags("activitypub")
@Controller()
export class OutboxController {
  constructor(private readonly activityPubService: ActivityPubService) {}

  @Get("/@:username/outbox")
  async getOutbox(@Param("username") username: string) {
    return this.activityPubService.getOutbox(username);
  }
}
