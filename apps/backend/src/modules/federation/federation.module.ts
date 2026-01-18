import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { FedifyModule } from '@fedify/nestjs';
import { RedisKvStore, RedisMessageQueue } from '@fedify/redis';
import { Redis } from 'ioredis';
import { FederationService } from './fedify.service.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { ConfigModule } from '../../config/config.module.js';

// Get the origin from environment or construct from domain
function getOrigin(): string {
  console.log('[FEDIFY MODULE] getOrigin() called');
  console.log('[FEDIFY MODULE] process.env.FEDIVERSE_DOMAIN =', process.env.FEDIVERSE_DOMAIN);
  console.log('[FEDIFY MODULE] process.env.FEDERATION_ORIGIN =', process.env.FEDERATION_ORIGIN);
  
  if (process.env.FEDIVERSE_DOMAIN) {
    const origin = `https://${process.env.FEDIVERSE_DOMAIN}`;
    console.log('[FEDIFY MODULE] Using FEDIVERSE_DOMAIN:', origin);
    return origin;
  }
  if (process.env.FEDERATION_ORIGIN) {
    console.log('[FEDIFY MODULE] Using FEDERATION_ORIGIN:', process.env.FEDERATION_ORIGIN);
    return process.env.FEDERATION_ORIGIN;
  }
  console.log('[FEDIFY MODULE] Using default: http://localhost:3002');
  return 'http://localhost:3002';
}

@Module({
  imports: [
    NestConfigModule,
    ConfigModule,
    AccountsModule,
    FedifyModule.forRoot({
      kv: new RedisKvStore(new Redis(process.env.REDIS_URL || 'redis://localhost:6379')),
      queue: new RedisMessageQueue(() => new Redis(process.env.REDIS_URL || 'redis://localhost:6379')),
      origin: getOrigin(),
    }),
  ],
  providers: [FederationService],
  exports: [FedifyModule, FederationService],
})
export class FederationModule {}
