/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { knex, Knex } from 'knex';

import { AppConfig } from '../config';
import {
  Account,
  EmailBounce,
  Email,
  TotpToken,
  RecoveryKey,
  SessionToken,
  SecurityEvent,
} from 'fxa-shared/db/models/auth';
import {
  RedisBase,
  Config as RedisConfig,
  IRedisCache,
} from 'fxa-shared/db/redis';

function typeCasting(field: any, next: any) {
  if (field.type === 'TINY' && field.length === 1) {
    return field.string() === '1';
  }
  return next();
}

export class RedisService extends RedisBase implements IRedisCache {
  constructor(config: RedisConfig) {
    super(config);
  }
  close(): void {
    // TODO
    throw new Error('Method not implemented.');
  }
  getSessionTokens(uid: string): Promise<any> {
    // TODO
    throw new Error('Method not implemented.');
  }
  touchSessionToken(uid: string, token: any): Promise<any> {
    // TODO
    throw new Error('Method not implemented.');
  }
  pruneSessionTokens(uid: string, tokenIds: any[]): Promise<any> {
    // TODO
    throw new Error('Method not implemented.');
  }
  del(uid: string): Promise<void> {
    // TODO
    throw new Error('Method not implemented.');
  }
}

@Injectable()
export class DatabaseService {
  public redis: RedisService;

  public knex: Knex;
  public account: typeof Account;
  public emails: typeof Email;
  public emailBounces: typeof EmailBounce;
  public securityEvents: typeof SecurityEvent;
  public totp: typeof TotpToken;
  public recoveryKeys: typeof RecoveryKey;
  public sessionTokens: typeof SessionToken;
  public oauthClients: typeof OAuthClients;

  constructor(configService: ConfigService<AppConfig>) {
    const dbConfig = configService.get('database') as AppConfig['database'];
    this.knex = knex({
      connection: { typeCast: typeCasting, ...dbConfig },
      client: 'mysql',
    });
    const redisConfig = configService.get('redis') as AppConfig['redis'];
    this.redis = new RedisService({
      ...redisConfig,
      keyPrefix: redisConfig.sessionTokens.prefix, // TOOD: Doublecheck, What prefix should be used?
      maxttl: 1000, // TODO: Double check
      recordLimit: 100, // TODO: Double check
      timeoutMs: 1000, // TODO: Double check
    });

    this.account = Account.bindKnex(this.knex);
    this.emails = Email.bindKnex(this.knex);
    this.emailBounces = EmailBounce.bindKnex(this.knex);
    this.securityEvents = SecurityEvent.bindKnex(this.knex);
    this.totp = TotpToken.bindKnex(this.knex);
    this.recoveryKeys = RecoveryKey.bindKnex(this.knex);
    this.sessionTokens = SessionToken.bindKnex(this.knex);
    this.oauthClients = OAth;
  }

  async dbHealthCheck(): Promise<Record<string, any>> {
    let status = 'ok';
    try {
      await this.account.query().limit(1);
    } catch (err) {
      status = 'error';
    }
    return {
      db: { status },
    };
  }
}
