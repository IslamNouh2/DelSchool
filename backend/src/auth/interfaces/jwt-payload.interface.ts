export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  role: string;
  roleId: number | null;
  tenantId: string | null;
  permissions: string[];
  profileId: number | null;
  tokenVersion: number;
}
