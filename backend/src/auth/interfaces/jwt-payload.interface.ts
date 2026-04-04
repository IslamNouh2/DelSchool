export interface JwtPayload {
  sub: number;
  role: string;
  tenantId: string | null;
  tokenVersion: number;
}
