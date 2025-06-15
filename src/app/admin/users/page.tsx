
// src/app/admin/users/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCog, Trash2, Edit3 } from 'lucide-react';
import type { SupabaseUser } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const getRoleBadgeVariant = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'admin': return 'destructive';
    case 'staff': return 'secondary';
    case 'customer':
    default: return 'outline';
  }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
        throw new Error(errorData.error);
      }
      const data: SupabaseUser[] = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Fetch users error:", error);
      toast({ title: "Error Fetching Users", description: (error as Error).message, variant: "destructive" });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEditUser = (userId: string) => {
    toast({ title: "Edit User", description: `Edit functionality for user ${userId} coming soon!`, variant: "default" });
  };

  const handleDeleteUser = (userId: string) => {
     if (!window.confirm("Are you sure you want to delete this user? This action is irreversible and will remove their profile. Auth user needs separate handling.")) {
      return;
    }
    toast({ title: "Delete User", description: `Delete functionality for user ${userId} coming soon! Consider manual Supabase deletion for now.`, variant: "default" });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">User Management</h1>
        <p className="text-muted-foreground">View and manage user accounts.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all registered users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar_url || `https://placehold.co/40x40.png?text=${(user.name || user.email).substring(0,1)}`} alt={user.name || user.email} data-ai-hint="person avatar" />
                      <AvatarFallback>{(user.name || user.email).substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {format(new Date(user.created_at), 'PP')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditUser(user.id)} title="Edit User (Soon)" disabled>
                        <UserCog className="h-4 w-4" />
                      </Button>
                       <Button variant="outline" size="icon" onClick={() => handleEditUser(user.id)} title="More Actions (Soon)" disabled>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      {/* <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(user.id)} title="Delete User (Soon)" disabled>
                        <Trash2 className="h-4 w-4" />
                      </Button> */}
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground text-center">
        Note: User deletion and advanced role management are complex. For now, roles are updated manually in Supabase.
      </p>
    </div>
  );
}
