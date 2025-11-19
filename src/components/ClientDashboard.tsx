import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Bell, ShieldCheck, Home, TrendingUp, Calendar, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  verificationStatus: string;
  propertyAlertsEnabled: boolean;
  matchingProperties: number;
  totalBookings: number;
  activeListings: number;
  userProfile: {
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
  activityScore: number;
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
        profileData,
        reviewsData,
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
        supabase
          .from("profiles")
          .select("full_name, avatar_url, created_at")
          .eq("id", user.id)
          .single(),
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("reviewer_user_id", user.id),
      ]);

      // Calculate activity score based on user engagement
      const verificationScore = verificationData.data?.status === "verified" ? 30 : 0;
      const bookingScore = Math.min((bookingsData.count || 0) * 10, 30);
      const propertyScore = Math.min((propertiesData.count || 0) * 15, 25);
      const reviewScore = Math.min((reviewsData.count || 0) * 5, 15);
      const activityScore = verificationScore + bookingScore + propertyScore + reviewScore;

      setStats({
        verificationStatus: verificationData.data?.status || "not_verified",
        propertyAlertsEnabled: preferencesData.data?.is_enabled || false,
        matchingProperties: 0,
        totalBookings: bookingsData.count || 0,
        activeListings: propertiesData.count || 0,
        userProfile: profileData.data || null,
        activityScore: activityScore,
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
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch {
      return "Recently joined";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
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
      </div>
    );
  }

  const getActivityLevel = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-500" };
    if (score >= 60) return { label: "Very Active", color: "text-blue-500" };
    if (score >= 40) return { label: "Active", color: "text-yellow-500" };
    if (score >= 20) return { label: "Getting Started", color: "text-orange-500" };
    return { label: "New Member", color: "text-muted-foreground" };
  };

  const activityLevel = getActivityLevel(stats?.activityScore || 0);

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
      icon: Calendar,
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
      title: "Activity Score",
      value: `${stats?.activityScore || 0}/100`,
      icon: Award,
      color: activityLevel.color,
      description: activityLevel.label,
    },
  ];

  return (
    <div className="space-y-6">
      {/* User Profile Header */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {getInitials(stats?.userProfile?.full_name || null)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">
                {stats?.userProfile?.full_name || "Welcome"}
              </h2>
              <p className="text-muted-foreground mt-1">
                Member {getMembershipDuration(stats?.userProfile?.created_at || new Date().toISOString())}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Award className={`h-4 w-4 ${activityLevel.color}`} />
                <span className={`text-sm font-medium ${activityLevel.color}`}>
                  {activityLevel.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  • {stats?.activityScore || 0} points
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
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
