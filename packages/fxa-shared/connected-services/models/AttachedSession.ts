export interface AttachedSession {
  id: string;
  createdAt: number;
  lastAccessTime: number;
  // TODO: Is this needed?
  // location: Location ;
  uaBrowser: string;
  uaOS: string;
  uaBrowserVersion: string;
  uaOSVersion: string;
  uaFormFactor: string;
}
