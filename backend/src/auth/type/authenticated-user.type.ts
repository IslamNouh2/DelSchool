export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions: string[];
}
