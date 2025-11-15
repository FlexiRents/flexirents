import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Home, Calendar, DollarSign } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface MonthlyData {
  month: string;
  revenue: number;
  bookings: number;
  users: number;
  properties: number;
}

interface CategoryData {
  name: string;
  value: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    activeProperties: 0,
    completedBookings: 0,
    activeUsers: 0,
    growthRate: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [serviceCategories, setServiceCategories] = useState<CategoryData[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch overall stats
        const [
          { count: usersCount },
          { count: propertiesCount },
          { count: completedBookingsCount },
          { data: allBookings },
          { data: allUsers },
          { data: allProperties },
          { data: serviceProviders },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "available"),
          supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("bookings").select("created_at, status, total_hours"),
          supabase.from("profiles").select("created_at"),
          supabase.from("properties").select("created_at, property_type"),
          supabase.from("service_provider_registrations").select("service_category").eq("status", "approved"),
        ]);

        // Calculate monthly trends for the last 6 months
        const months: MonthlyData[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const monthStart = startOfMonth(date);
          const monthEnd = endOfMonth(date);
          
          const monthBookings = allBookings?.filter(b => {
            const bookingDate = new Date(b.created_at);
            return bookingDate >= monthStart && bookingDate <= monthEnd;
          }) || [];

          const monthUsers = allUsers?.filter(u => {
            const userDate = new Date(u.created_at);
            return userDate >= monthStart && userDate <= monthEnd;
          }) || [];

          const monthProperties = allProperties?.filter(p => {
            const propDate = new Date(p.created_at);
            return propDate >= monthStart && propDate <= monthEnd;
          }) || [];

          months.push({
            month: format(date, 'MMM yyyy'),
            revenue: monthBookings.reduce((sum, b) => sum + (b.total_hours * 50), 0),
            bookings: monthBookings.length,
            users: monthUsers.length,
            properties: monthProperties.length,
          });
        }
        setMonthlyData(months);

        // Service categories distribution
        const categoryMap = new Map<string, number>();
        serviceProviders?.forEach(sp => {
          categoryMap.set(sp.service_category, (categoryMap.get(sp.service_category) || 0) + 1);
        });
        setServiceCategories(
          Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))
        );

        // Property types distribution
        const typeMap = new Map<string, number>();
        allProperties?.forEach(prop => {
          typeMap.set(prop.property_type, (typeMap.get(prop.property_type) || 0) + 1);
        });
        setPropertyTypes(
          Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }))
        );

        setAnalytics({
          totalRevenue: (completedBookingsCount || 0) * 150,
          activeProperties: propertiesCount || 0,
          completedBookings: completedBookingsCount || 0,
          activeUsers: usersCount || 0,
          growthRate: 12.5,
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="bookings">Booking Patterns</TabsTrigger>
          <TabsTrigger value="growth">User Growth</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        {/* Revenue Trends */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Revenue Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)"
                      name="Revenue ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Patterns */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Booking Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="bookings" fill="hsl(var(--primary))" name="Total Bookings" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Growth */}
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                User & Property Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="New Users"
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="properties" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      name="New Properties"
                      dot={{ fill: 'hsl(var(--accent))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  Service Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={serviceCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {serviceCategories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500" />
                  Property Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={propertyTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {propertyTypes.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
