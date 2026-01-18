import { Injectable } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { Account } from './entities/account.entity.js';
import { v4 as uuid } from "uuid";

interface CreateAccountData {
  username: string;
  displayName: string;
  feedUrl: string;
  privateKey: string;
  publicKey: string;
  actorUrl: string;
  summary?: string;
}

@Injectable()
export class AccountsService {
  constructor(private em: EntityManager) {}

  async create(data: CreateAccountData): Promise<Account> {
    const id = uuid();

    const account = new Account(
      id,
      data.username,
      data.displayName,
      data.feedUrl,
      data.privateKey,
      data.publicKey,
      data.actorUrl,
      true,
      data.summary,
    );

    this.em.persist(account);
    await this.em.flush();
    return account;
  }

  async findAll(): Promise<Account[]> {
    return this.em.find(Account, {});
  }

  async findOne(id: string): Promise<Account | null> {
    return this.em.findOne(Account, { id });
  }

  async findByUsername(username: string): Promise<Account | null> {
    return this.em.findOne(Account, { username });
  }

  async update(id: string, updateData: Partial<Account>): Promise<Account> {
    const account = await this.em.findOne(Account, { id });
    if (!account) throw new Error("Account not found");

    Object.assign(account, updateData);
    account.updatedAt = new Date();
    await this.em.flush();
    return account;
  }

  async remove(id: string): Promise<void> {
    const account = await this.em.findOne(Account, { id });
    if (account) {
      this.em.remove(account);
      await this.em.flush();
    }
  }
}
