export type AttachedOAuthClient = {
  refresh_token_id: string;
  created_time: number;
  last_access_time: number;
  scope: string[] | null;
  client_id: string | null;
  client_name: string | null;
};
