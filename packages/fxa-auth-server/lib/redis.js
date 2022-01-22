/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

const { RedisShared } = require('../../fxa-shared/db/redis');
const AccessToken = require('./oauth/db/accessToken');
const hex = require('buf').to.hex;
const { resolve } = require('path');

class FxaRedis extends RedisShared {
  constructor(config) {
    super(config);
    this.defineCommands(resolve(__dirname, 'luaScripts'));
  }

  touchSessionToken(uid, token) {
    // remove keys with null values
    const json = JSON.stringify(token, (k, v) => (v == null ? undefined : v));
    return Promise.race([
      this.redis.touchSessionToken(uid, json),
      this.resolveInMs(this.timeoutMs),
    ]);
  }

  pruneSessionTokens(uid, tokenIds = []) {
    return Promise.race([
      this.redis.pruneSessionTokens(uid, JSON.stringify(tokenIds)),
      this.rejectInMs(this.timeoutMs),
    ]);
  }

  async getSessionTokens(uid) {
    try {
      const value = await Promise.race([
        this.redis.getSessionTokens(uid),
        this.rejectInMs(this.timeoutMs),
      ]);
      return JSON.parse(value);
    } catch (e) {
      this.log.error('redis', e);
      return {};
    }
  }

  /**
   *
   * @param {Buffer | string} tokenId
   * @return {Promise<AccessToken>}
   */
  async getAccessToken(tokenId) {
    try {
      const value = await this.redis.get(hex(tokenId));
      if (!value) {
        return null;
      }
      return AccessToken.parse(value);
    } catch (e) {
      this.log.error('redis', e);
      return null;
    }
  }

  /**
   *
   * @param {AccessToken} token
   */
  setAccessToken(token) {
    if (token.ttl < 1) {
      this.log.error('redis', new Error('invalid ttl on access token'));
      return;
    }
    return this.redis.setAccessToken(
      token.userId.toString('hex'),
      token.tokenId.toString('hex'),
      JSON.stringify(token),
      this.recordLimit,
      token.ttl,
      this.maxttl
    );
  }

  /**
   *
   * @param {Buffer | string} id
   * @returns {Promise<boolean>} done
   */
  async removeAccessToken(id) {
    // This does not remove the id from the user's index
    // because getAccessTokens cleans up expired/missing tokens
    const done = await this.redis.removeAccessToken(hex(id));
    return !!done;
  }

  /**
   *
   * @param {Buffer | string} uid
   */
  removeAccessTokensForPublicClients(uid) {
    return this.redis.removeAccessTokensForPublicClients(hex(uid));
  }

  /**
   *
   * @param {Buffer | string} uid
   * @param {Buffer | string} clientId
   */
  removeAccessTokensForUserAndClient(uid, clientId) {
    return this.redis.removeAccessTokensForUserAndClient(
      hex(uid),
      hex(clientId)
    );
  }

  /**
   *
   * @param {Buffer | string} uid
   */
  removeAccessTokensForUser(uid) {
    return this.redis.removeAccessTokensForUser(hex(uid));
  }

  /**
   * @param {Buffer | string} uid
   * @param {Buffer | string} tokenId
   * @param {RefreshTokenMetadata} token
   */
  setRefreshToken(uid, tokenId, token) {
    return Promise.race([
      this.redis.setRefreshToken(
        hex(uid),
        hex(tokenId),
        JSON.stringify(token),
        this.recordLimit,
        this.maxttl
      ),
      this.resolveInMs(this.timeoutMs),
    ]);
  }

  /**
   *
   * @param {Buffer | string} uid
   * @param {Buffer | string} tokenId
   */
  async removeRefreshToken(uid, tokenId) {
    return Promise.race([
      this.redis.hdel(hex(uid), hex(tokenId)),
      this.resolveInMs(this.timeoutMs),
    ]);
  }

  /**
   *
   * @param {Buffer | string} uid
   */
  removeRefreshTokensForUser(uid) {
    return Promise.race([
      this.redis.unlink(hex(uid)),
      this.resolveInMs(this.timeoutMs),
    ]);
  }

  del(key) {
    return this.redis.del(key);
  }

  get(key) {
    return this.redis.get(key);
  }

  set(key, val, ...args) {
    return this.redis.set(key, val, ...args);
  }
  zadd(key, ...args) {
    return this.redis.zadd(key, ...args);
  }
  zrange(key, start, stop, withScores) {
    if (withScores) {
      return this.redis.zrange(key, start, stop, 'WITHSCORES');
    }
    return this.redis.zrange(key, start, stop);
  }
  zrangebyscore(key, min, max) {
    return this.redis.zrangebyscore(key, min, max);
  }
  zrem(key, ...members) {
    return this.redis.zrem(key, members);
  }
  zrevrange(key, start, stop) {
    return this.redis.zrevrange(key, start, stop);
  }
  zrevrangebyscore(key, min, max) {
    return this.redis.zrevrangebyscore(key, min, max);
  }
  zrank(key, member) {
    return this.redis.zrank(key, member);
  }

  async zpoprangebyscore(key, min, max) {
    const args = Array.from(arguments);
    const results = await this.redis
      .multi()
      .zrangebyscore(...args)
      .zremrangebyscore(key, min, max)
      .exec();
    return results[0][1];
  }
}

module.exports = (config, log) => {
  if (!config.enabled) {
    return;
  }
  return new FxaRedis(config, log);
};
module.exports.FxARedis = FxaRedis;
