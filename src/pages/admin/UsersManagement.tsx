import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { format } from "date-fns";

type AppRole = "admin" | "moderator" | "service_provider" | "user" | "vendor";

interface UserData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id, role");

        if (rolesError) throw rolesError;

        const rolesMap = new Map<string, string[]>();
        roles?.forEach((role) => {
          if (!rolesMap.has(role.user_id)) {
            rolesMap.set(role.user_id, []);
          }
          rolesMap.get(role.user_id)?.push(role.role);
        });

        const usersData = profiles?.map((profile) => ({
          ...profile,
          roles: rolesMap.get(profile.id) || ["user"],
        })) || [];

        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleAddRole = async (userId: string, role: string) => {
    if (!role) {
      toast.error("Please select a role");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as AppRole });

      if (error) {
        if (error.code === "23505") {
          toast.error("User already has this role");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Role added successfully");
      setSelectedRole(prev => ({ ...prev, [userId]: "" }));
      
      // Refresh users
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, roles: [...user.roles, role] }
          : user
      );
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error adding role:", error);
      toast.error("Failed to add role");
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    if (role === "user") {
      toast.error("Cannot remove default 'user' role");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as AppRole);

      if (error) throw error;

      toast.success("Role removed successfully");
      
      // Refresh users
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, roles: user.roles.filter(r => r !== role) }
          : user
      );
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Users Management</h2>
        <p className="text-muted-foreground mt-2">Manage all registered users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Manage Roles</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name || "Anonymous"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="flex items-center gap-1">
                            {role}
                            {role !== "user" && (
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => handleRemoveRole(user.id, role)}
                              />
                            )}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedRole[user.id] || ""}
                          onValueChange={(value) => setSelectedRole(prev => ({ ...prev, [user.id]: value }))}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="service_provider">Service Provider</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={() => handleAddRole(user.id, selectedRole[user.id])}
                          disabled={!selectedRole[user.id]}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "MMM dd, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
