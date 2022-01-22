import { Location } from './Location';

export interface AttachedDevice {
  id: string;
  uid: string;
  sessionTokenId: string;
  name: string | null | undefined;
  type: string | null | undefined;
  createdAt: number | undefined;
  callbackIsExpired: boolean;
  refreshTokenId: string | null | undefined;
  pushCallback: string | null | undefined;
  pushPublicKey: string | null | undefined;
  pushAuthKey: string | null | undefined;
  pushEndpointExpired: boolean;
  availableCommands: {
    [key: string]: string;
  };
  uaBrowser: string | null | undefined;
  uaBrowserVersion: string | null | undefined;
  uaOS: string | null | undefined;
  uaOSVersion: string | null | undefined;
  uaDeviceType: string | null | undefined;
  uaFormFactor: string | null | undefined;

  lastAccessTime: number | null | undefined;
  location: Location;
}
