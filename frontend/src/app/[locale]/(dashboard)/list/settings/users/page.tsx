'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  UserPlus, 
  ShieldCheck, 
  UserX, 
  Lock, 
  Unlock,
  MoreHorizontal
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const t = useTranslations('admin');
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, locked: 0 });
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', roleId: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes, rolesRes] = await Promise.all([
        api.get('/users', { params: { search } }),
        api.get('/users/stats'),
        api.get('/roles')
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const toggleStatus = async (userId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.put(`/users/${userId}`, { status: newStatus });
      toast.success(`User status updated to ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleLock = async (userId: number, isLocked: boolean) => {
    try {
      await api.put(`/users/${userId}`, { status: isLocked ? 'ACTIVE' : 'LOCKED' });
      toast.success(isLocked ? 'User unlocked' : 'User locked');
      fetchData();
    } catch (error) {
      toast.error('Failed to update lock status');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      toast.success('User created successfully');
      setIsAddUserOpen(false);
      setNewUser({ username: '', email: '', password: '', roleId: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system accounts, roles, and security status.</p>
        </div>
        <PermissionGuard permissions={['user:create']}>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-lg shadow-blue-500/20">
                <UserPlus className="mr-2 h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <p className="text-sm text-muted-foreground">Add a new staff member or administrator to the system.</p>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="johndoe" 
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="john@example.com" 
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="••••••••" 
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={(val) => setNewUser({...newUser, roleId: val})} value={newUser.roleId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {roles.map((role: any) => (
                        <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full rounded-xl">Create Account</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PermissionGuard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-none shadow-sm bg-blue-50/50 dark:bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-green-50/50 dark:bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-red-50/50 dark:bg-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked Accounts</CardTitle>
            <Lock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locked}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              className="pl-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading users...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
                </TableRow>
              ) : (
                users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg px-2 py-0 border-blue-500/20 text-blue-500 bg-blue-500/5">
                        {user.role?.name || 'GUEST'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`rounded-lg px-2 py-0 ${
                          user.status === 'ACTIVE' 
                            ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}
                        variant="outline"
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <PermissionGuard permissions={['user:update']}>
                            <DropdownMenuItem onClick={() => toggleStatus(user.id, user.status)}>
                              <UserX className="mr-2 h-4 w-4" /> 
                              {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleLock(user.id, user.status === 'LOCKED')}>
                              {user.status === 'LOCKED' ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                              {user.status === 'LOCKED' ? 'Unlock Account' : 'Lock Account'}
                            </DropdownMenuItem>
                          </PermissionGuard>
                          {!hasPermission('user:update') && (
                            <div className="p-2 text-xs text-muted-foreground text-center">
                              No write access
                            </div>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
