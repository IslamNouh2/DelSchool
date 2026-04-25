export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  role: string;
  roleId: number | null;
  permissions: string[];
  profileId: number | null;
  tenantId: string | null;
}
