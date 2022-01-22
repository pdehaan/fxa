import Redis from 'ioredis';
import { readdirSync, readFileSync } from 'fs';
import { basename, extname, resolve } from 'path';
import { RefreshTokenMetadata } from './models/auth/refresh-token-meta-data';
import { AccessToken } from './models/auth/access-token';
const hex = require('buf').to.hex;

export interface IRedisCache {
  close(): void;
  getSessionTokens(uid: string): Promise<any>;
  touchSessionToken(uid: string, token: any): Promise<any>;
  pruneSessionTokens(uid: string, tokenIds: any[]): Promise<any>;
  del(uid: string): Promise<void>;
}

export interface ILog {
  error(...args: any): void;
}

export type Config = {
  recordLimit: number;
  maxttl: number;
  timeoutMs: number;
} & Redis.RedisOptions;

export type DynamicRedis = Redis.Redis & {
  getAccessTokens?: (val: any) => Promise<string[]>;
};

export class RedisBase {
  protected redis: DynamicRedis;

  protected get keyPrefix() {
    return this.config.keyPrefix;
  }
  protected get recordLimit() {
    return this.config.recordLimit;
  }
  protected get maxttl() {
    return this.config.maxttl;
  }
  protected get timeoutMs() {
    return this.config.timeoutMs || 1000;
  }

  constructor(
    protected readonly config: Config,
    protected readonly log?: ILog
  ) {
    this.redis = new Redis(config);
  }

  protected defineCommands(directory: string) {
    this.getScriptNames(directory).forEach((name: string) =>
      this.defineCommand(name, directory)
    );
  }

  protected resolveInMs(ms: number, value?: any) {
    return new Promise<any>((resolve) => setTimeout(() => resolve(value), ms));
  }

  protected rejectInMs(ms: number, err = new Error('redis timeout')) {
    return new Promise((_, reject) => setTimeout(() => reject(err), ms));
  }

  private defineCommand(scriptName: string, directory: string) {
    const [name, numberOfKeys] = scriptName.split('_');
    this.redis.defineCommand(name, {
      lua: readFileSync(resolve(directory, `${name}.lua`), {
        encoding: 'utf8',
      }),
      numberOfKeys: +numberOfKeys,
    });
  }

  private getScriptNames(directory: string) {
    const dir = resolve(directory);
    const scriptNames = readdirSync(dir)
      .filter(
        (dirent: any) => dirent.isFile() && extname(dirent.name) === '.lua'
      )
      .map((dirent: any) => basename(dirent.name, '.lua'));

    return scriptNames;
  }

  close() {
    return this.redis.quit();
  }
}

export class RedisShared extends RedisBase {
  /**
   *
   * @param {Buffer | string} uid
   * @return {Promise<{[key: string]: RefreshTokenMetadata}>}
   */
  async getRefreshTokens(uid: Buffer | string) {
    try {
      const tokens = await Promise.race([
        this.redis.hgetall(hex(uid)),
        this.resolveInMs(this.timeoutMs, {}),
      ]);
      for (const id of Object.keys(tokens)) {
        tokens[id] = RefreshTokenMetadata.parse(tokens[id]);
      }
      return tokens;
    } catch (e) {
      this.log?.error('redis', e);
      return {};
    }
  }

  /**
   *
   * @param {Buffer | string} uid
   * @param {(Buffer | string)[]} tokenIdsToPrune
   */
  pruneRefreshTokens(
    uid: Buffer | String,
    tokenIdsToPrune: Buffer[] | string[]
  ) {
    return Promise.race([
      this.redis.hdel(hex(uid), ...tokenIdsToPrune.map((v) => hex(v))),
      this.resolveInMs(this.timeoutMs),
    ]);
  }

  /**
   *
   * @param {Buffer | string} uid
   * @return {Promise<AccessToken[]>}
   */
  async getAccessTokens(uid: Buffer | String) {
    if (!this.redis.getAccessTokens) {
      throw new Error(
        'Misssing getAccessTokens. Check that custom commands were defined.'
      );
    }

    try {
      const values = await this.redis.getAccessTokens(hex(uid));
      return values.map((v: string) => AccessToken.parse(v));
    } catch (e) {
      this.log?.error('redis', e);
      return [];
    }
  }
}
