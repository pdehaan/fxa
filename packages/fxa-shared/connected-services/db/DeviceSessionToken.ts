import { Location } from '../models/Location';

export type DeviceSessionToken = {
  lastAccessTime?: number | null;
  location: Location;
  uaBrowser: string;
  uaBrowserVersion: string;
  uaDeviceType: string;
  uaFormFactor?: string;
  uaOS: string;
  uaOSVersion: string;
  id: string;
  callbackURL: string;
  callbackAuthKey: string;
  callbackPublicKey: string;
};
