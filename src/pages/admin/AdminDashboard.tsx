import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, Briefcase, Store, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  users: number;
  properties: number;
  serviceProviders: number;
  vendors: number;
  bookings: number;
  reviews: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: usersCount },
          { count: propertiesCount },
          { count: serviceProvidersCount },
          { count: vendorsCount },
          { count: bookingsCount },
          { count: reviewsCount },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("properties").select("*", { count: "exact", head: true }),
          supabase.from("service_provider_registrations").select("*", { count: "exact", head: true }),
          supabase.from("vendor_registrations").select("*", { count: "exact", head: true }),
          supabase.from("bookings").select("*", { count: "exact", head: true }),
          supabase.from("reviews").select("*", { count: "exact", head: true }),
        ]);

        setStats({
          users: usersCount || 0,
          properties: propertiesCount || 0,
          serviceProviders: serviceProvidersCount || 0,
          vendors: vendorsCount || 0,
          bookings: bookingsCount || 0,
          reviews: reviewsCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: "Total Users", value: stats?.users, icon: Users, color: "text-blue-500" },
    { title: "Properties", value: stats?.properties, icon: Home, color: "text-green-500" },
    { title: "Service Providers", value: stats?.serviceProviders, icon: Briefcase, color: "text-purple-500" },
    { title: "Vendors", value: stats?.vendors, icon: Store, color: "text-orange-500" },
    { title: "Bookings", value: stats?.bookings, icon: Calendar, color: "text-pink-500" },
    { title: "Reviews", value: stats?.reviews, icon: MessageSquare, color: "text-indigo-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Welcome to Admin Dashboard</h2>
        <p className="text-muted-foreground mt-2">Manage and monitor your platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
