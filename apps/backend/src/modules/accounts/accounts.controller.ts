import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AccountsService } from './accounts.service.js';

@ApiTags("accounts")
@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async findAll() {
    return this.accountsService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.accountsService.findOne(id);
  }
}
