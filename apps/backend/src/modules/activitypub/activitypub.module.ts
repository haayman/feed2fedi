import { Module } from "@nestjs/common";
import { ActivityPubService } from "./activitypub.service";
import {
  WebFingerController,
  ActorController,
  OutboxController,
} from "./activitypub.controller";
import { AccountsModule } from "../accounts/accounts.module";
import { PostsModule } from "../posts/posts.module";
import { ConfigModule } from "../../config/config.module";

@Module({
  imports: [AccountsModule, PostsModule, ConfigModule],
  providers: [ActivityPubService],
  controllers: [WebFingerController, ActorController, OutboxController],
  exports: [ActivityPubService],
})
export class ActivityPubModule {}
