import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Users, Home, Calendar } from "lucide-react";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    activeProperties: 0,
    completedBookings: 0,
    activeUsers: 0,
    growthRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [
          { count: usersCount },
          { count: propertiesCount },
          { count: completedBookingsCount },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "available"),
          supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "completed"),
        ]);

        setAnalytics({
          totalRevenue: (completedBookingsCount || 0) * 150, // Mock calculation
          activeProperties: propertiesCount || 0,
          completedBookings: completedBookingsCount || 0,
          activeUsers: usersCount || 0,
          growthRate: 12.5, // Mock data
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      icon: BarChart3,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Active Properties",
      value: analytics.activeProperties,
      icon: Home,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completed Bookings",
      value: analytics.completedBookings,
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      title: "Active Users",
      value: analytics.activeUsers,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Growth Rate",
      value: `+${analytics.growthRate}%`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-muted-foreground mt-2">Track platform performance and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
