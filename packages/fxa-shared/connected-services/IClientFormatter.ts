import { AttachedClient } from './models/AttachedClient';

export interface IClientFormatter {
  formatLocation(client: AttachedClient, acceptLanguage: string): void;
  formatTimestamps(client: AttachedClient, acceptLanguage: string): void;
}
