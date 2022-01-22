/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import convict from 'convict';
import fs from 'fs';
import path from 'path';

convict.addFormats(require('convict-format-with-moment'));
convict.addFormats(require('convict-format-with-validator'));

const conf = convict({
  authHeader: {
    default: 'oidc-claim-id-token-email',
    doc: 'Authentication header that should be logged for the user',
    env: 'AUTH_HEADER',
    format: String,
  },
  database: {
    database: {
      default: 'fxa',
      doc: 'MySQL database',
      env: 'DB_DATABASE',
      format: String,
    },
    host: {
      default: 'localhost',
      doc: 'MySQL host',
      env: 'DB_HOST',
      format: String,
    },
    password: {
      default: '',
      doc: 'MySQL password',
      env: 'DB_PASSWORD',
      format: String,
    },
    port: {
      default: 3306,
      doc: 'MySQL port',
      env: 'DB_PORT',
      format: Number,
    },
    user: {
      default: 'root',
      doc: 'MySQL username',
      env: 'DB_USERNAME',
      format: String,
    },
  },
  redis: {
    host: {
      default: 'localhost',
      env: 'REDIS_HOST',
      format: String,
      doc: 'IP address or host name for Redis server',
    },
    port: {
      default: 6379,
      env: 'REDIS_PORT',
      format: 'port',
      doc: 'Port for Redis server',
    },
    accessTokens: {
      host: {
        default: 'localhost',
        env: 'ACCESS_TOKEN_REDIS_HOST',
        format: String,
      },
      port: {
        default: 6379,
        env: 'ACCESS_TOKEN_REDIS_PORT',
        format: 'port',
      },
      prefix: {
        default: 'at:',
        env: 'ACCESS_TOKEN_REDIS_KEY_PREFIX',
        format: String,
        doc: 'Key prefix for access tokens in Redis',
      },
      recordLimit: {
        default: 100,
        env: 'ACCESS_TOKEN_REDIS_LIMIT',
        format: Number,
        doc: 'Maximum number of access tokens per account at any one time',
      },
    },
    refreshTokens: {
      enabled: {
        default: true,
        doc: 'Enable Redis for refresh token metadata',
        format: Boolean,
        env: 'REFRESH_TOKEN_REDIS_ENABLED',
      },
      host: {
        default: 'localhost',
        env: 'REFRESH_TOKEN_REDIS_HOST',
        format: String,
      },
      port: {
        default: 6379,
        env: 'REFRESH_TOKEN_REDIS_PORT',
        format: 'port',
      },
      prefix: {
        default: 'rt:',
        env: 'REFRESH_TOKEN_REDIS_KEY_PREFIX',
        format: String,
        doc: 'Key prefix for refresh tokens in Redis',
      },
      maxttl: {
        default: 86400000,
        env: 'REFRESH_TOKEN_REDIS_MAX_TTL',
        format: Number,
        doc: 'ttl for redis data',
      },
      recordLimit: {
        default: 20,
        env: 'REFRESH_TOKEN_REDIS_LIMIT',
        format: Number,
        doc: 'Maximum number of refresh tokens per account stored in redis',
      },
    },
    sessionTokens: {
      enabled: {
        default: true,
        doc: 'Enable Redis for session tokens',
        format: Boolean,
        env: 'USE_REDIS',
      },
      prefix: {
        default: 'fxa-auth-session',
        env: 'SESSIONS_REDIS_KEY_PREFIX',
        format: String,
        doc: 'Key prefix for session tokens in Redis',
      },
      maxConnections: {
        default: 200,
        env: 'REDIS_POOL_MAX_CONNECTIONS',
        format: 'int',
        doc: 'Maximum connection count for the session token Redis pool',
      },
      minConnections: {
        default: 2,
        env: 'REDIS_POOL_MIN_CONNECTIONS',
        format: 'int',
        doc: 'Minimum connection count for the session token Redis pool',
      },
    },
    email: {
      enabled: {
        default: true,
        doc: 'Enable Redis for email config',
        format: Boolean,
        env: 'EMAIL_CONFIG_USE_REDIS',
      },
      prefix: {
        default: 'email:',
        env: 'EMAIL_CONFIG_REDIS_KEY_PREFIX',
        format: String,
        doc: 'Key prefix for the email config Redis pool',
      },
      maxConnections: {
        default: 10,
        env: 'EMAIL_CONFIG_REDIS_POOL_MAX_CONNECTIONS',
        format: 'int',
        doc: 'Maximum connection count for the email config Redis pool',
      },
      minConnections: {
        default: 1,
        env: 'EMAIL_CONFIG_REDIS_POOL_MIN_CONNECTIONS',
        format: 'int',
        doc: 'Minimum connection count for the email config Redis pool',
      },
    },
    subhub: {
      enabled: {
        default: true,
        doc: 'Enable Redis for subhub responses',
        format: Boolean,
        env: 'SUBHUB_USE_REDIS',
      },
      prefix: {
        default: 'subhub:',
        env: 'SUBHUB_REDIS_KEY_PREFIX',
        format: String,
        doc: 'Key prefix for subhub responses in Redis',
      },
      maxConnections: {
        default: 10,
        env: 'SUBHUB_REDIS_POOL_MAX_CONNECTIONS',
        format: 'int',
        doc: 'Maximum connection count for the subhub responses Redis pool',
      },
      minConnections: {
        default: 1,
        env: 'SUBHUB_REDIS_POOL_MIN_CONNECTIONS',
        format: 'int',
        doc: 'Minimum connection count for the subhub responses Redis pool',
      },
    },
    maxPending: {
      default: 1000,
      env: 'REDIS_POOL_MAX_PENDING',
      format: 'int',
      doc: 'Pending request limit for Redis',
    },
    retryCount: {
      default: 5,
      env: 'REDIS_POOL_RETRY_COUNT',
      format: 'int',
      doc: 'Retry limit for Redis connection attempts',
    },
    initialBackoff: {
      default: '100 milliseconds',
      env: 'REDIS_POOL_TIMEOUT',
      format: 'duration',
      doc: 'Initial backoff for Redis connection retries, increases exponentially with each attempt',
    },
  },
  env: {
    default: 'production',
    doc: 'The current node.js environment',
    env: 'NODE_ENV',
    format: ['development', 'test', 'stage', 'production'],
  },
  log: {
    app: { default: 'fxa-user-admin-server' },
    fmt: {
      default: 'heka',
      env: 'LOGGING_FORMAT',
      format: ['heka', 'pretty'],
    },
    level: {
      default: 'info',
      env: 'LOG_LEVEL',
    },
  },
  port: {
    default: 8095,
    doc: 'Default port to listen on',
    env: 'PORT',
    format: Number,
  },
  sentryDsn: {
    default: '',
    doc: 'Sentry DSN for error and log reporting',
    env: 'SENTRY_DSN',
    format: 'String',
  },
  hstsEnabled: {
    default: true,
    doc: 'Send a Strict-Transport-Security header',
    env: 'HSTS_ENABLED',
    format: Boolean,
  },
  hstsMaxAge: {
    default: 31536000, // a year
    doc: 'Max age of the STS directive in seconds',
    // Note: This format is a number because the value needs to be in seconds
    format: Number,
  },
});

// handle configuration files.  you can specify a CSV list of configuration
// files to process, which will be overlayed in order, in the CONFIG_FILES
// environment variable.

// Need to move two dirs up as we're in the compiled directory now
const configDir = path.dirname(path.dirname(__dirname));
let envConfig = path.join(configDir, 'config', `${conf.get('env')}.json`);
envConfig = `${envConfig},${process.env.CONFIG_FILES || ''}`;
const files = envConfig.split(',').filter(fs.existsSync);
conf.loadFile(files);
conf.validate({ allowed: 'strict' });
const Config = conf;

export type AppConfig = ReturnType<typeof Config['getProperties']>;
export default Config;
