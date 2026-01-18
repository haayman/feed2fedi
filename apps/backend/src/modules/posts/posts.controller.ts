import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PostsService } from './posts.service.js';

@ApiTags("posts")
@Controller("accounts/:accountId/posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async findByAccountId(@Param("accountId") accountId: string) {
    return this.postsService.findByAccountId(accountId);
  }
}
