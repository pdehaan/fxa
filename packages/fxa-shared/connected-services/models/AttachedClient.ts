import { Location } from './Location';

export type AttachedClient = {
  clientId: string | null;
  deviceId: string | null;
  sessionTokenId: string | null;
  refreshTokenId: string | null;
  isCurrentSession: boolean;
  deviceType?: string | null; // TODO: Double check type
  name?: string | null;
  scope: Array<string> | null;
  location: Partial<Location> | null;
  userAgent: string;
  os: string | null;
  createdTime?: number | null;
  createdTimeFormatted: string;
  lastAccessTime?: number | null;
  lastAccessTimeFormatted: string;
  approximateLastAccessTime?: number | null;
  approximateLastAccessTimeFormatted: string;
};
