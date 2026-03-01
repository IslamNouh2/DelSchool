'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function RolesManagementPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/permissions')
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
      if (rolesRes.data.length > 0 && !selectedRole) {
        setSelectedRole(rolesRes.data[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const hasPermission = (role: any, permId: number) => {
    return role.permissions?.some((rp: any) => rp.permissionId === permId);
  };

  const togglePermission = async (permId: number) => {
    if (!selectedRole) return;
    
    const active = hasPermission(selectedRole, permId);
    try {
      if (active) {
        await api.delete(`/roles/${selectedRole.id}/permissions/${permId}`);
      } else {
        await api.post(`/roles/${selectedRole.id}/permissions/${permId}`);
      }
      fetchData(); // Refresh to get updated mapping
      // Also update local selectedRole
      const updatedRolesRes = await api.get('/roles');
      const updatedRole = updatedRolesRes.data.find((r: any) => r.id === selectedRole.id);
      setSelectedRole(updatedRole);
      toast.success('Permissions updated');
    } catch (error) {
      toast.error('Failed to update permission');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/roles', newRole);
      toast.success('Role created successfully');
      setIsAddRoleOpen(false);
      setNewRole({ name: '', description: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create role');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Define security roles and map specific privileges.</p>
        </div>
        <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-blue-500/20">
              <Plus className="mr-2 h-4 w-4" /> Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <p className="text-sm text-muted-foreground">Define a new security role for the system.</p>
            </DialogHeader>
            <form onSubmit={handleCreateRole} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input 
                  id="name" 
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value.toUpperCase()})}
                  placeholder="MANAGER" 
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  placeholder="Department manager access" 
                  className="rounded-xl"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full rounded-xl">Create Role</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2 px-2">
            <Lock className="w-4 h-4 text-blue-500" /> Available Roles
          </h3>
          {roles.map((role: any) => (
            <Card 
              key={role.id} 
              className={`rounded-2xl border-none cursor-pointer transition-all shadow-sm ${
                selectedRole?.id === role.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-500/10' 
                  : 'hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
              onClick={() => setSelectedRole(role)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${selectedRole?.id === role.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">{role.name}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">{role.permissions?.length || 0} Permissions</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedRole?.id === role.id ? 'translate-x-1' : 'text-gray-300'}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permissions Mapping */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-3xl border-none shadow-sm min-h-[500px]">
            <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-black tracking-tight">
                  {selectedRole ? `Permissions for ${selectedRole.name}` : 'Select a Role'}
                </CardTitle>
                {selectedRole && (
                    <Badge variant="outline" className="rounded-lg text-xs font-black bg-blue-500/5 border-blue-500/20 text-blue-500">
                        SYSTEM ROLE
                    </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Click a permission badge to toggle it for the selected role.
              </p>
            </CardHeader>
            <CardContent className="pt-8">
              {!selectedRole ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Shield className="w-12 h-12 opacity-10 mb-4" />
                  <p>Select a role from the left to manage its permissions.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(
                    permissions.reduce((acc: any, perm: any) => {
                      const [category] = perm.name.split(':');
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(perm);
                      return acc;
                    }, {})
                  ).map(([category, categoryPerms]: [string, any]) => (
                    <div key={category} className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                        {category} Management
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {categoryPerms.map((perm: any) => (
                          <div 
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                              hasPermission(selectedRole, perm.id)
                                ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-500/5'
                                : 'border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${hasPermission(selectedRole, perm.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400 group-hover:text-blue-500'}`}>
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold tracking-tight">{perm.name}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{perm.description || 'No description'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
