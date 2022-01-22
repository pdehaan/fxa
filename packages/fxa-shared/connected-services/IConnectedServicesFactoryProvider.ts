import { AttachedDevice } from './models/AttachedDevice';
import { AttachedOAuthClient } from './models/AttachedOAuthClient';
import { AttachedSession } from './models/AttachedSession';
import { IClientFormatter } from './IClientFormatter';

/**
 * Give access to server context needed by the connected services factory
 */

export interface IConnectedServicesFactoryProvider {
  getDeviceList(): Promise<AttachedDevice[]>;
  getOAuthClients(): Promise<AttachedOAuthClient[]>;
  getAttachedSessions(): Promise<AttachedSession[]>;
  synthesizeClientName(session: AttachedSession): string;
  getClientFormatter(): IClientFormatter;
}
