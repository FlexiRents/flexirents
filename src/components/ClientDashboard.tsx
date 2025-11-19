import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Bell, ShieldCheck, Wallet, CreditCard, Home, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  verificationStatus: string;
  propertyAlertsEnabled: boolean;
  matchingProperties: number;
  totalBookings: number;
  activeListings: number;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      const [
        verificationData,
        preferencesData,
        bookingsData,
        propertiesData,
      ] = await Promise.all([
        supabase
          .from("user_verification")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_preferences")
          .select("is_enabled")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", user.id),
      ]);

      setStats({
        verificationStatus: verificationData.data?.status || "not_verified",
        propertyAlertsEnabled: preferencesData.data?.is_enabled || false,
        matchingProperties: 0, // This will be calculated based on preferences
        totalBookings: bookingsData.count || 0,
        activeListings: propertiesData.count || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      case "rejected":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getVerificationStatusText = (status: string) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "pending":
        return "Pending Review";
      case "rejected":
        return "Rejected";
      default:
        return "Not Verified";
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Verification Status",
      value: getVerificationStatusText(stats?.verificationStatus || "not_verified"),
      icon: ShieldCheck,
      color: getVerificationStatusColor(stats?.verificationStatus || "not_verified"),
      description: "Account verification",
    },
    {
      title: "Property Alerts",
      value: stats?.propertyAlertsEnabled ? "Active" : "Paused",
      icon: Bell,
      color: stats?.propertyAlertsEnabled ? "text-green-500" : "text-muted-foreground",
      description: "Notification preferences",
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings || 0,
      icon: CreditCard,
      color: "text-blue-500",
      description: "All-time bookings",
    },
    {
      title: "Active Listings",
      value: stats?.activeListings || 0,
      icon: Home,
      color: "text-purple-500",
      description: "Your properties",
    },
    {
      title: "Wallet Balance",
      value: "GHS 0.00",
      icon: Wallet,
      color: "text-orange-500",
      description: "Available funds",
    },
    {
      title: "Activity Score",
      value: "85%",
      icon: TrendingUp,
      color: "text-green-500",
      description: "Platform engagement",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">
          Track your account metrics and activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>No recent activity to display.</p>
            <p className="mt-2">
              Your bookings, property interactions, and account updates will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
