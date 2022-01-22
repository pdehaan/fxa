import { AttachedClient } from './models/AttachedClient';
import { IConnectedServicesFactoryProvider } from './IConnectedServicesFactoryProvider';
import { Device } from '../db/models/auth';

const defaultClientFields: AttachedClient = {
  clientId: null,
  deviceId: null,
  sessionTokenId: null,
  refreshTokenId: null,
  isCurrentSession: false,
  deviceType: null,
  name: null,
  createdTime: Infinity,
  lastAccessTime: 0,
  scope: null,
  location: null,
  userAgent: '',
  os: null,
  createdTimeFormatted: '',
  lastAccessTimeFormatted: '',
  approximateLastAccessTime: 0,
  approximateLastAccessTimeFormatted: '',
};

export interface ISessionCache {
  getSessionTokens(uid: string): Promise<any>;
}

export function synthesizeClientNameFromSession(device: AttachedSession) {
  const uaBrowser = device.uaBrowser;
  const uaBrowserVersion = device.uaBrowserVersion;
  const uaOS = device.uaOS;
  const uaOSVersion = device.uaOSVersion;
  const uaFormFactor = device.uaFormFactor;
  let result = '';

  if (uaBrowser) {
    if (uaBrowserVersion) {
      const splitIndex = uaBrowserVersion.indexOf('.');
      result = `${uaBrowser} ${
        splitIndex === -1
          ? uaBrowserVersion
          : uaBrowserVersion.substr(0, splitIndex)
      }`;
    } else {
      result = uaBrowser;
    }

    if (uaOS || uaFormFactor) {
      result += ', ';
    }
  }

  if (uaFormFactor) {
    return `${result}${uaFormFactor}`;
  }

  if (uaOS) {
    result += uaOS;

    if (uaOSVersion) {
      result += ` ${uaOSVersion}`;
    }
  }

  return result;
}

export class ConnectedServicesFactory {
  private clientsBySessionTokenId = new Map<string, AttachedClient>();
  private clientsByRefreshTokenId = new Map<string, AttachedClient>();

  constructor(private readonly provider: IConnectedServicesFactoryProvider) {}

  public async build(sessionTokenId: string, acceptLanguage: string) {
    let attachedClients: any[] = [];

    this.mergeDevices(attachedClients);
    this.mergeOauthClients(attachedClients);
    this.mergeSessions(attachedClients, sessionTokenId);

    // Now we can do some final tweaks of each item for display.
    for (const client of attachedClients) {
      const clientFormatter = this.provider.getClientFormatter();
      clientFormatter.formatTimestamps(client, acceptLanguage);
      clientFormatter.formatLocation(client, acceptLanguage);
      if (client.deviceId && !client.deviceType) {
        client.deviceType = 'desktop';
      }
      client.name = client.name.replace('Mac OS X', 'macOS');
    }
  }

  protected mergeSessions(attachedClients: any[], sessionTokenId: string) {
    for (const session of this.provider.getAttachedSessions()) {
      let client = this.clientsBySessionTokenId.get(session.id);
      if (!client) {
        client = {
          ...this.getDefaultClientFields(),
          sessionTokenId: session.id,
          createdTime: session.createdAt,
        };
        attachedClients.push(client);
      }
      client.createdTime = Math.min(client.createdTime, session.createdAt);
      client.lastAccessTime = Math.max(
        client.lastAccessTime,
        session.lastAccessTime
      );
      if (client.sessionTokenId === sessionTokenId) {
        client.isCurrentSession = true;
      }
      // Any client holding a sessionToken can grant themselves any scope.
      client.scope = null;
      // Location, OS and UA are currently only available on sessionTokens, so we can
      // copy across without worrying about merging with data from the device record.
      client.location = session.location ? { ...session.location } : null;
      client.os = session.uaOS || null;
      if (!session.uaBrowser) {
        client.userAgent = '';
      } else if (!session.uaBrowserVersion) {
        client.userAgent = session.uaBrowser;
      } else {
        const { uaBrowser: browser, uaBrowserVersion: version } = session;
        client.userAgent = `${browser} ${version.split('.')[0]}`;
      }
      if (!client.name) {
        client.name = this.provider.synthesizeClientName(session);
      }
    }
  }

  protected mergeOauthClients(attachedClients: any[]) {
    for (const oauthClient of this.provider.getOAuthClients()) {
      let client = this.clientsByRefreshTokenId.get(
        oauthClient.refresh_token_id
      );
      if (client) {
        client.refreshTokenId = oauthClient.refresh_token_id;
      } else {
        client = {
          ...this.getDefaultClientFields(),
          refreshTokenId: oauthClient.refresh_token_id || null,
          createdTime: oauthClient.created_time,
          lastAccessTime: oauthClient.last_access_time,
        };
        attachedClients.push(client);
      }
      client.clientId = oauthClient.client_id;
      client.scope = oauthClient.scope;
      client.createdTime = Math.min(
        client.createdTime,
        oauthClient.created_time
      );
      client.lastAccessTime = Math.max(
        client.lastAccessTime,
        oauthClient.last_access_time
      );
      // We fill in a default device name from the OAuth client name,
      // but individual clients can override this in their device record registration.
      if (!client.name) {
        client.name = oauthClient.client_name;
      }
      // For now we assume that all oauth clients that register a device record are mobile apps.
      // Ref https://github.com/mozilla/fxa/issues/449
      if (client.deviceId && !client.deviceType) {
        client.deviceType = 'mobile';
      }
    }
  }

  protected mergeDevices(attachedClients: any[]) {
    for (const device of this.provider.getDeviceList()) {
      const client = {
        ...this.getDefaultClientFields(),
        sessionTokenId: device.sessionTokenId || null,
        // The refreshTokenId might be a dangling pointer, don't set it
        // until we know whether the corresponding token exists in the OAuth db.
        refreshTokenId: null,
        deviceId: device.id,
        deviceType: device.type,
        name: device.name,
        createdTime: device.createdAt,
        lastAccessTime: device.createdAt,
      };
      attachedClients.push(client);
      if (device.sessionTokenId) {
        this.clientsBySessionTokenId.set(device.sessionTokenId, client);
      }
      if (device.refreshTokenId) {
        this.clientsByRefreshTokenId.set(device.refreshTokenId, client);
      }
    }
  }

  protected getDefaultClientFields() {
    return defaultClientFields;
  }
}
