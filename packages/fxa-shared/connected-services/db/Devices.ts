import { Device } from '../../db/models/auth';
import { AttachedDevice } from '../models/AttachedDevice';
import { DeviceSessionToken } from './DeviceSessionToken';

export interface IDeviceSession {
  getSessionTokens(uid: string): Promise<Device[]>;
}

export async function lookupDevices(
  uid: string,
  lastAccessTimeEnabled: boolean,
  redis: IDeviceSession
) {
  const promises = [Device.findByUid(uid)];

  if (redis) {
    promises.push(redis.getSessionTokens(uid));
  }

  const [devices, redisSessionTokens = {}] = await Promise.all(promises);
  return devices.map((device) => {
    return merge(device, redisSessionTokens, lastAccessTimeEnabled);
  });
}

function merge(
  device: Device,
  redisSessionTokens: Record<string, DeviceSessionToken>,
  lastAccessTimeEnabled: boolean
) {
  // If there's a matching sessionToken in redis, use the more up-to-date
  // location and access-time info from there rather than from the DB.
  const token = redisSessionTokens[device.sessionTokenId];
  const mergedInfo = Object.assign({}, device, token);
  const merged: AttachedDevice = {
    id: mergedInfo.id,
    uid: mergedInfo.uid,
    callbackIsExpired: mergedInfo.callbackIsExpired,
    sessionTokenId: mergedInfo.sessionTokenId,
    refreshTokenId: mergedInfo.refreshTokenId,
    lastAccessTime: lastAccessTimeEnabled ? mergedInfo.lastAccessTime : null,
    location: mergedInfo.location,
    name: mergedInfo.name,
    type: mergedInfo.type,
    createdAt: mergedInfo.createdAt,
    pushCallback: mergedInfo.callbackURL,
    pushPublicKey: mergedInfo.callbackPublicKey,
    pushAuthKey: mergedInfo.callbackAuthKey,
    pushEndpointExpired: !!mergedInfo.callbackIsExpired,
    availableCommands: mergedInfo.availableCommands || {},
    uaBrowser: mergedInfo.uaBrowser,
    uaBrowserVersion: mergedInfo.uaBrowserVersion,
    uaOS: mergedInfo.uaOS,
    uaOSVersion: mergedInfo.uaOSVersion,
    uaDeviceType: mergedInfo.uaDeviceType,
    uaFormFactor: mergedInfo.uaFormFactor,
  };

  return merged;
}
