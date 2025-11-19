import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { User, Mail, Phone, LogOut, Settings, LayoutDashboard, FileText, MapPin, ShieldCheck, Bell, Lock, Trash2, Globe, Moon, Sun, Award, Medal, Trophy, Crown, Star, Camera } from "lucide-react";
import VerificationForm from "@/components/VerificationForm";
import PropertyPreferences from "@/components/PropertyPreferences";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import ClientDashboard from "@/components/ClientDashboard";
import { usePropertyNotifications } from "@/hooks/usePropertyNotifications";
import { Separator } from "@/components/ui/separator";
import RentalBillingHistory from "@/components/RentalBillingHistory";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
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
  avatar_url: string | null;
  created_at: string;
}

interface VerificationStatus {
  status: string;
}

type ActivePanel = "dashboard" | "billing" | "verification" | "preferences" | "settings";

const menuItems = [
  { id: "dashboard" as ActivePanel, title: "Dashboard", icon: LayoutDashboard },
  { id: "billing" as ActivePanel, title: "Billing History", icon: FileText },
  { id: "verification" as ActivePanel, title: "Verification", icon: ShieldCheck },
  { id: "preferences" as ActivePanel, title: "Property Alerts", icon: Bell },
  { id: "settings" as ActivePanel, title: "Settings", icon: Settings },
];

export default function ClientProfile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile>({ 
    full_name: null, 
    phone: null, 
    avatar_url: null,
    created_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [activePanel, setActivePanel] = useState<ActivePanel>(
    (location.state as any)?.activePanel || "dashboard"
  );
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingNotifications, setBookingNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [tenantAddress, setTenantAddress] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<string>("not_verified");
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

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
      fetchVerificationStatus();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url, created_at")
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

  const fetchVerificationStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_verification")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setVerificationStatus(data.status);
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
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

      setProfile({ ...profile, full_name: fullName, phone: phone });
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
      .toUpperCase()
      .slice(0, 2);
  };

  const getMembershipDuration = (createdAt: string) => {
    try {
      const created = new Date(createdAt);
      const now = new Date();
      const diffInMonths = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
      const years = Math.floor(diffInMonths / 12);
      
      if (years >= 1) {
        return `${years}+ year${years > 1 ? 's' : ''} on Flexi`;
      } else if (diffInMonths >= 1) {
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} on Flexi`;
      } else {
        return "New on Flexi";
      }
    } catch {
      return "New on Flexi";
    }
  };

  const getLastSeen = () => {
    if (!user?.last_sign_in_at) return null;
    try {
      const distance = formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true });
      // Shorten the format: "22 minutes ago" -> "22 min ago"
      return distance
        .replace(' minutes', ' min')
        .replace(' minute', ' min')
        .replace(' hours', ' hr')
        .replace(' hour', ' hr')
        .replace(' days', ' d')
        .replace(' day', ' d')
        .replace('about ', '');
    } catch {
      return null;
    }
  };

  const getBadgeTier = (score: number) => {
    if (score >= 90) {
      return { 
        name: "Platinum", 
        icon: Crown, 
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200"
      };
    } else if (score >= 70) {
      return { 
        name: "Gold", 
        icon: Trophy, 
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200"
      };
    } else if (score >= 50) {
      return { 
        name: "Silver", 
        icon: Star, 
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200"
      };
    } else {
      return { 
        name: "Bronze", 
        icon: Medal, 
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200"
      };
    }
  };

  const getVerificationLabel = (status: string) => {
    switch (status) {
      case "verified":
        return { text: "Verified", color: "text-green-600" };
      case "pending":
        return { text: "Pending", color: "text-yellow-600" };
      case "rejected":
        return { text: "Rejected", color: "text-red-600" };
      default:
        return { text: "Not Verified", color: "text-muted-foreground" };
    }
  };

  const calculateProfileCompletion = () => {
    let completed = 0;
    let total = 3;

    // Check phone
    if (profile.phone) completed++;
    // Check avatar
    if (profile.avatar_url) completed++;
    // Check verification
    if (verificationStatus === "verified") completed++;

    return Math.round((completed / total) * 100);
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
        <div className="flex min-h-[calc(100vh-140px)] w-full pt-20">
          <Sidebar className="border-r top-16">
            <SidebarContent className="pt-6">
              {/* User Profile Header */}
              <div className="p-4 border-b bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="flex items-center gap-4">
                  <div className="relative group flex-shrink-0">
                    <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <button
                      onClick={() => setShowAvatarUpload(true)}
                      className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      aria-label="Upload profile picture"
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {profile.full_name || "Welcome"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {getMembershipDuration(profile.created_at)}
                    </p>
                    {getLastSeen() && (
                      <p className="text-xs text-muted-foreground">
                        Last seen {getLastSeen()}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      {/* Badge Tier */}
                      {(() => {
                        const badge = getBadgeTier(calculateProfileCompletion());
                        const BadgeIcon = badge.icon;
                        return (
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${badge.bgColor} ${badge.borderColor}`}>
                            <BadgeIcon className={`h-3.5 w-3.5 ${badge.color}`} />
                            <span className={`text-xs font-semibold ${badge.color}`}>
                              {badge.name}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Profile Completion Progress */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{calculateProfileCompletion()} pts</span>
                        <span className="text-xs text-muted-foreground">{calculateProfileCompletion()}%</span>
                      </div>
                      <Progress value={calculateProfileCompletion()} className="h-1.5" />
                    </div>
                  </div>
                </div>
              </div>

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

            {activePanel === "dashboard" && (
              <ClientDashboard />
            )}

            {activePanel === "billing" && (
              <RentalBillingHistory />
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
      
      {/* Profile Picture Upload Dialog */}
      {showAvatarUpload && user && (
        <ProfilePictureUpload
          currentImageUrl={profile.avatar_url}
          onImageUpdate={(url) => {
            setProfile({ ...profile, avatar_url: url });
            setShowAvatarUpload(false);
            toast.success("Profile picture updated successfully!");
          }}
          bucketName="avatars"
          userType="user"
          userId={user.id}
        />
      )}
      
      <Footer />
    </div>
  );
}
