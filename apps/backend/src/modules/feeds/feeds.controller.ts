import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
} from "@nestjs/common";
import { FeedsService, CreateFeedDto, UpdateFeedDto } from './feeds.service.js';
import { Feed } from './entities/feed.entity.js';

@Controller("feeds")
export class FeedsController {
  private readonly logger = new Logger(FeedsController.name);

  constructor(private readonly feedsService: FeedsService) {}

  @Post()
  async create(@Body() createFeedDto: CreateFeedDto): Promise<Feed> {
    this.logger.log(`Creating feed: ${createFeedDto.url}`);
    return this.feedsService.create(createFeedDto);
  }

  @Get()
  async findAll(): Promise<Feed[]> {
    return this.feedsService.findAll();
  }

  @Get("account/:accountId")
  async findByAccountId(@Param("accountId") accountId: string): Promise<Feed[]> {
    return this.feedsService.findByAccountId(accountId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<Feed | null> {
    return this.feedsService.findOne(id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateFeedDto: UpdateFeedDto,
  ): Promise<Feed> {
    return this.feedsService.update(id, updateFeedDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string): Promise<void> {
    return this.feedsService.remove(id);
  }
}
