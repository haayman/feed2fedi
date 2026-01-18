import { Module } from "@nestjs/common";
import { ActivityPubService } from './activitypub.service.js';
import {
  WebFingerController,
  ActorController,
  OutboxController,
} from './activitypub.controller.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { PostsModule } from '../posts/posts.module.js';
import { ConfigModule } from '../../config/config.module.js';

@Module({
  imports: [AccountsModule, PostsModule, ConfigModule],
  providers: [ActivityPubService],
  controllers: [WebFingerController, ActorController, OutboxController],
  exports: [ActivityPubService],
})
export class ActivityPubModule {}
