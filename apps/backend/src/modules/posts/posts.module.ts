import { Module } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { PostsService } from "./posts.service";
import { PostsController } from "./posts.controller";
import { Post } from "./entities/post.entity";

@Module({
  imports: [MikroOrmModule.forFeature([Post])],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
