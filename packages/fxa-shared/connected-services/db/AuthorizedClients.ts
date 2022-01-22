import * as ScopeSet from 'fxa-shared/oauth/scopes';
import { MysqlStoreShared } from '../../db/mysql';
import { RedisShared } from '../../db/redis';

const hex = require('buf').to.hex;

export class OauthRedisShared {
  constructor(
    protected readonly redisAccessTokens: RedisShared,
    protected readonly redisRefreshTokens: RedisShared
  ) {}

  async close() {
    await this.redisAccessTokens.close();
    await this.redisRefreshTokens.close();
  }

  /**
   *
   * @param {Buffer | string} uid
   * @param {(Buffer | string)[]} tokenIdsToPrune
   */
  pruneRefreshTokens(
    uid: Buffer | string,
    tokenIdsToPrune: Buffer[] | string[]
  ) {
    if (!this.redisRefreshTokens) {
      return null;
    }
    return this.redisRefreshTokens.pruneRefreshTokens(uid, tokenIdsToPrune);
  }

  /**
   *
   * @param {Buffer | string} uid
   * @return {Promise<{[key: string]: RefreshTokenMetadata}>}
   */
  async getRefreshTokens(uid: Buffer | string) {
    if (!this.redisRefreshTokens) {
      return {};
    }
    return this.redisRefreshTokens.getRefreshTokens(uid);
  }

  /**
   *
   * @param {Buffer | string} uid
   * @return {Promise<AccessToken[]>}
   */
  async getAccessTokens(uid: Buffer | string) {
    return this.redisAccessTokens.getAccessTokens(uid);
  }
}

/**
 * Wrapper for database operations pertaining to oauth
 */
export class OAuthDbShared {
  protected oauthRedisShared: OauthRedisShared;
  constructor(
    protected readonly mysql: MysqlStoreShared,
    redisAccessTokens: RedisShared,
    redisRefreshTokens: RedisShared
  ) {
    this.oauthRedisShared = new OauthRedisShared(
      redisAccessTokens,
      redisRefreshTokens
    );
  }

  async getRefreshTokensByUid(uid: string) {
    const db = await this.mysql;
    const tokens = await db.getRefreshTokensByUid(uid);
    const extraMetadata = await this.oauthRedisShared.getRefreshTokens(uid);
    // We'll take this opportunity to clean up any tokens that exist in redis but
    // not in mysql, so this loop deletes each token from `extraMetadata` once handled.
    for (const t of tokens) {
      const id = hex(t.tokenId);
      if (id in extraMetadata) {
        Object.assign(t, extraMetadata[id]);
        delete extraMetadata[id];
      }
    }
    // Now we can prune any tokens found in redis but not mysql.
    const toDel = Object.keys(extraMetadata);
    if (toDel.length > 0) {
      await this.oauthRedisShared.pruneRefreshTokens(uid, toDel);
    }
    return tokens;
  }

  async getAccessTokensByUid(uid: string) {
    const tokens = await this.oauthRedisShared.getAccessTokens(uid);
    const db = await this.mysql;
    const otherTokens = await db.getAccessTokensByUid(uid);
    return tokens.concat(otherTokens);
  }
}

export class AuthorizedClientsDB {
  constructor(protected readonly oauthDb: OAuthDbShared) {}

  async list(uid: string) {
    const oauthDB = await this.oauthDb;
    const authorizedClients = [];

    // First, enumerate all the refresh tokens.
    // Each of these is a separate instance of an authorized client
    // and should be displayed to the user as such. Nice and simple!
    const seenClientIds = new Set();
    for (const token of await oauthDB.getRefreshTokensByUid(uid)) {
      const clientId = hex(token.clientId);
      authorizedClients.push(serialize(clientId, token));
      seenClientIds.add(clientId);
    }

    // Next, enumerate all the access tokens. In the interests of giving the user a
    // complete-yet-comprehensible list of all the things attached to their account,
    // we want to:
    //
    //  1. Show a single unified record for any client that is not using refresh tokens.
    //  2. Avoid showing access tokens for `canGrant` clients; such clients will always
    //     hold some other sort of token, and we don't want them to appear in the list twice.
    const accessTokenRecordsByClientId = new Map();
    for (const token of await oauthDB.getAccessTokensByUid(uid)) {
      const clientId = hex(token.clientId);
      if (!seenClientIds.has(clientId) && !token.clientCanGrant) {
        let record = accessTokenRecordsByClientId.get(clientId);
        if (typeof record === 'undefined') {
          record = {
            clientId,
            clientName: token.clientName,
            createdAt: token.createdAt,
            lastUsedAt: token.createdAt,
            scope: ScopeSet.fromArray([]),
          };
          accessTokenRecordsByClientId.set(clientId, record);
        }
        // Merge details of all access tokens into a single record.
        record.scope.add(token.scope);
        if (token.createdAt < record.createdAt) {
          record.createdAt = token.createdAt;
        }
        if (record.lastUsedAt < token.createdAt) {
          record.lastUsedAt = token.createdAt;
        }
      }
    }
    for (const [clientId, record] of accessTokenRecordsByClientId.entries()) {
      authorizedClients.push(serialize(clientId, record));
    }

    // Sort the final list first by last_access_time, then by client_name, then by created_time.
    authorizedClients.sort(function (a, b) {
      if (b.last_access_time > a.last_access_time) {
        return 1;
      }
      if (b.last_access_time < a.last_access_time) {
        return -1;
      }
      if (a.client_name > b.client_name) {
        return 1;
      }
      if (a.client_name < b.client_name) {
        return -1;
      }
      if (a.created_time > b.created_time) {
        return 1;
      }
      if (a.created_time < b.created_time) {
        return -1;
      }
      // To help provide a deterministic result order to simplify testing, also sort of scope values.
      if (a.scope > b.scope) {
        return 1;
      }
      if (a.scope < b.scope) {
        return -1;
      }
      return 0;
    });
    return authorizedClients;
  }
}

// Helper function to render each returned record in the expected form.
function serialize(clientIdHex: string, token: any) {
  const createdTime = token.createdAt.getTime();
  const lastAccessTime = token.lastUsedAt.getTime();
  return {
    client_id: clientIdHex,
    refresh_token_id: token.tokenId ? hex(token.tokenId) : undefined,
    client_name: token.clientName,
    created_time: createdTime,
    last_access_time: lastAccessTime,
    // Sort the scopes alphabetically, for consistent output.
    scope: token.scope.getScopeValues().sort(),
  };
}
