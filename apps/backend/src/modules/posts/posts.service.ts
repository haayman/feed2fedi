import { Injectable } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { Post } from "./entities/post.entity";

@Injectable()
export class PostsService {
  constructor(private readonly em: EntityManager) {}

  async findAll(): Promise<Post[]> {
    return this.em.find(Post, {});
  }

  async findByAccountId(accountId: string): Promise<Post[]> {
    return this.em.find(Post, { account: accountId });
  }

  async findOne(id: string): Promise<Post | null> {
    return this.em.findOne(Post, { id });
  }
}
