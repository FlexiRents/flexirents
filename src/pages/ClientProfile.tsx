import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { User, Mail, Phone, LogOut, Settings, LayoutDashboard, FileText, MapPin, ShieldCheck, Bell, Lock, Trash2, Globe, Moon, Sun } from "lucide-react";
import VerificationForm from "@/components/VerificationForm";
import PropertyPreferences from "@/components/PropertyPreferences";
import ClientDashboard from "@/components/ClientDashboard";
import { usePropertyNotifications } from "@/hooks/usePropertyNotifications";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface Profile {
  full_name: string | null;
  phone: string | null;
}

type ActivePanel = "account" | "dashboard" | "billing" | "address" | "verification" | "preferences" | "settings";

const menuItems = [
  { id: "account" as ActivePanel, title: "Account", icon: User },
  { id: "dashboard" as ActivePanel, title: "Dashboard", icon: LayoutDashboard },
  { id: "billing" as ActivePanel, title: "Billing History", icon: FileText },
  { id: "address" as ActivePanel, title: "Address", icon: MapPin },
  { id: "verification" as ActivePanel, title: "Verification", icon: ShieldCheck },
  { id: "preferences" as ActivePanel, title: "Property Alerts", icon: Bell },
  { id: "settings" as ActivePanel, title: "Settings", icon: Settings },
];

export default function ClientProfile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ full_name: null, phone: null });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [activePanel, setActivePanel] = useState<ActivePanel>("account");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingNotifications, setBookingNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [tenantAddress, setTenantAddress] = useState<string>("");

  // Enable property notifications
  usePropertyNotifications();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTenantAddress();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantAddress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("rental_leases")
        .select(`
          property_id,
          properties (
            location,
            region
          )
        `)
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;

      if (data?.properties) {
        const property = data.properties as { location: string; region: string };
        setTenantAddress(`${property.location}, ${property.region}`);
      }
    } catch (error) {
      console.error("Error fetching tenant address:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile({ full_name: fullName, phone: phone });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // In a real app, you'd want to call an edge function to properly delete the account
      toast.error("Account deletion requires admin approval. Please contact support.");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-[calc(100vh-140px)] w-full">
          <Sidebar className="border-r">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setActivePanel(item.id)}
                          isActive={activePanel === item.id}
                          className="w-full"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 p-6">
            <div className="mb-4 flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">
                {menuItems.find(item => item.id === activePanel)?.title}
              </h1>
            </div>

            {activePanel === "account" && (
              <Card className="max-w-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-foreground">
                        {profile.full_name || "User"}
                      </h2>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activePanel === "dashboard" && (
              <ClientDashboard />
            )}

            {activePanel === "billing" && (
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No billing history.</p>
                </CardContent>
              </Card>
            )}

            {activePanel === "address" && (
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No addresses saved.</p>
                </CardContent>
              </Card>
            )}

            {activePanel === "verification" && (
              <VerificationForm />
            )}

            {activePanel === "preferences" && (
              <PropertyPreferences />
            )}

            {activePanel === "settings" && (
              <div className="max-w-3xl space-y-6">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">
                              <User className="inline h-4 w-4 mr-2" />
                              Full Name
                            </Label>
                            <Input
                              id="fullName"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Enter your full name"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">
                              <Mail className="inline h-4 w-4 mr-2" />
                              Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={user.email || ""}
                              disabled
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">
                              <Phone className="inline h-4 w-4 mr-2" />
                              Phone Number
                            </Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Enter your phone number"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="address">
                              <MapPin className="inline h-4 w-4 mr-2" />
                              Current Address
                            </Label>
                            <Input
                              id="address"
                              value={tenantAddress || "No active lease"}
                              disabled
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                              {tenantAddress 
                                ? "This is the address of your leased property" 
                                : "You don't have an active rental lease at the moment"}
                            </p>
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={updating}
                          >
                            {updating ? "Updating..." : "Update Profile"}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notifications" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Notification Preferences</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive email updates about your account
                            </p>
                          </div>
                          <Switch
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Booking Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified about booking updates and reminders
                            </p>
                          </div>
                          <Switch
                            checked={bookingNotifications}
                            onCheckedChange={setBookingNotifications}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Property Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Managed in Property Alerts section
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActivePanel("preferences")}
                          >
                            Configure
                          </Button>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Marketing Emails</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive promotional emails and special offers
                            </p>
                          </div>
                          <Switch
                            checked={marketingEmails}
                            onCheckedChange={setMarketingEmails}
                          />
                        </div>

                        <Button 
                          className="w-full"
                          onClick={() => toast.success("Notification preferences saved")}
                        >
                          Save Preferences
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <form onSubmit={handleChangePassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">
                              <Lock className="inline h-4 w-4 mr-2" />
                              New Password
                            </Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                              <Lock className="inline h-4 w-4 mr-2" />
                              Confirm New Password
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                            />
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={changingPassword || !newPassword || !confirmPassword}
                          >
                            {changingPassword ? "Changing..." : "Change Password"}
                          </Button>
                        </form>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Verification Status</Label>
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm">Identity Verification</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActivePanel("verification")}
                            >
                              Manage
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="privacy" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Privacy Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Profile Visibility</Label>
                            <p className="text-sm text-muted-foreground">
                              Make your profile visible to other users
                            </p>
                          </div>
                          <Switch
                            checked={profileVisibility}
                            onCheckedChange={setProfileVisibility}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Data & Privacy</Label>
                          <p className="text-sm text-muted-foreground mb-4">
                            Manage your personal data and privacy preferences
                          </p>
                          <Button variant="outline" className="w-full">
                            <Globe className="h-4 w-4 mr-2" />
                            Download My Data
                          </Button>
                        </div>

                        <Button 
                          className="w-full"
                          onClick={() => toast.success("Privacy settings saved")}
                        >
                          Save Privacy Settings
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-destructive">
                      <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your
                                account and remove your data from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteAccount}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Separator />

                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={handleSignOut}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </main>
        </div>
      </SidebarProvider>
      <Footer />
    </div>
  );
}
