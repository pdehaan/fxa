import { Location } from './Location';

export type DeviceSchema = {
  id: string;
  location: Location;
  name: string;
  nameResponse: string;
  type: string;
  pushCallback: string;
  pushPublicKey: string;
  pushAuthKey: string;
  pushEndpointExpired: boolean;
  availableCommands: Record<string, string>;
};
