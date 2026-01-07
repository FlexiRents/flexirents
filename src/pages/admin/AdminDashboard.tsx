import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Home, Briefcase, Store, Calendar, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Eye, Clock, CheckCircle, XCircle, AlertCircle, MapPin, FileCheck, UserCheck, Bell, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Stats {
  users: number;
  properties: number;
  availableProperties: number;
  rentedProperties: number;
  activeLeases: number;
  serviceProviders: number;
  approvedProviders: number;
  pendingProviders: number;
  vendors: number;
  approvedVendors: number;
  pendingVendors: number;
  bookingRequests: number;
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  viewingSchedules: number;
  pendingViewings: number;
  confirmedViewings: number;
  completedViewings: number;
  reviews: number;
  totalRevenue: number;
  totalProfit: number;
  monthlyProfit: number;
  lastMonthProfit: number;
  profitGrowth: number;
  pendingPayments: number;
  verifiedPayments: number;
  verifiedUsers: number;
  pendingVerifications: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  profit: number;
}

interface RegionData {
  name: string;
  properties: number;
  bookings: number;
}

interface RecentActivity {
  id: string;
  type: "booking" | "viewing" | "property" | "user" | "payment";
  title: string;
  description: string;
  time: string;
  status?: string;
}

interface Notification {
  id: string;
  type: "booking" | "payment" | "user" | "viewing";
  title: string;
  description: string;
  time: Date;
  read: boolean;
}

const COMMISSION_RATE = 0.10;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [propertyTypeData, setPropertyTypeData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const addNotification = useCallback((notification: Omit<Notification, "id" | "read" | "time">) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      time: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const months = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i);
          return {
            start: startOfMonth(date).toISOString(),
            end: endOfMonth(date).toISOString(),
            label: format(date, "MMM"),
          };
        });

        const currentMonthStart = startOfMonth(new Date()).toISOString();
        const lastMonthStart = startOfMonth(subMonths(new Date(), 1)).toISOString();
        const lastMonthEnd = endOfMonth(subMonths(new Date(), 1)).toISOString();

        const [
          { count: usersCount },
          { count: propertiesCount },
          { count: availablePropertiesCount },
          { count: rentedPropertiesCount },
          { count: activeLeasesCount },
          { count: serviceProvidersCount },
          { count: approvedProvidersCount },
          { count: pendingProvidersCount },
          { count: vendorsCount },
          { count: approvedVendorsCount },
          { count: pendingVendorsCount },
          { count: bookingRequestsCount },
          { count: pendingBookingsCount },
          { count: approvedBookingsCount },
          { count: rejectedBookingsCount },
          { count: viewingSchedulesCount },
          { count: pendingViewingsCount },
          { count: confirmedViewingsCount },
          { count: completedViewingsCount },
          { count: reviewsCount },
          { data: verifiedPayments },
          { data: pendingPaymentsData },
          { count: verifiedUsersCount },
          { count: pendingVerificationsCount },
          { count: newUsersThisMonthCount },
          { count: newUsersLastMonthCount },
          { data: propertiesData },
          { data: bookingRequestsData },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("properties").select("*", { count: "exact", head: true }),
          supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "available"),
          supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "rented"),
          supabase.from("rental_leases").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("service_provider_registrations").select("*", { count: "exact", head: true }),
          supabase.from("service_provider_registrations").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("service_provider_registrations").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("vendor_registrations").select("*", { count: "exact", head: true }),
          supabase.from("vendor_registrations").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("vendor_registrations").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("booking_requests").select("*", { count: "exact", head: true }),
          supabase.from("booking_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("booking_requests").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("booking_requests").select("*", { count: "exact", head: true }).in("status", ["rejected", "declined"]),
          supabase.from("viewing_schedules").select("*", { count: "exact", head: true }),
          supabase.from("viewing_schedules").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("viewing_schedules").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
          supabase.from("viewing_schedules").select("*", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("reviews").select("*", { count: "exact", head: true }),
          supabase.from("rental_payments").select("amount, payment_type, created_at").eq("verification_status", "verified"),
          supabase.from("rental_payments").select("amount").eq("verification_status", "unverified").eq("status", "pending"),
          supabase.from("user_verification").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("user_verification").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", currentMonthStart),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
          supabase.from("properties").select("region, property_type, listing_type"),
          supabase.from("booking_requests").select("created_at, status").order("created_at", { ascending: false }).limit(5),
        ]);

        const totalRevenue = verifiedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const totalProfit = totalRevenue * COMMISSION_RATE;
        const pendingAmount = pendingPaymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        const currentMonthPayments = verifiedPayments?.filter(p => p.created_at >= currentMonthStart) || [];
        const lastMonthPayments = verifiedPayments?.filter(p => p.created_at >= lastMonthStart && p.created_at <= lastMonthEnd) || [];

        const monthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const monthlyProfit = monthlyRevenue * COMMISSION_RATE;
        const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const lastMonthProfit = lastMonthRevenue * COMMISSION_RATE;

        const profitGrowth = lastMonthProfit > 0 
          ? ((monthlyProfit - lastMonthProfit) / lastMonthProfit) * 100 
          : monthlyProfit > 0 ? 100 : 0;

        const chartData: MonthlyData[] = months.map(month => {
          const monthPayments = verifiedPayments?.filter(p => p.created_at >= month.start && p.created_at <= month.end) || [];
          const revenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          return { month: month.label, revenue, profit: revenue * COMMISSION_RATE };
        });

        // Region data
        const regionCounts: Record<string, { properties: number; bookings: number }> = {};
        propertiesData?.forEach(p => {
          if (p.region) {
            if (!regionCounts[p.region]) regionCounts[p.region] = { properties: 0, bookings: 0 };
            regionCounts[p.region].properties++;
          }
        });

        const topRegions = Object.entries(regionCounts)
          .sort((a, b) => b[1].properties - a[1].properties)
          .slice(0, 5)
          .map(([name, data]) => ({ name, ...data }));

        // Property type breakdown
        const typeCounts: Record<string, number> = {};
        propertiesData?.forEach(p => {
          const type = p.property_type || "Other";
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const typeColors: Record<string, string> = {
          apartment: "hsl(var(--chart-1))",
          house: "hsl(var(--chart-2))",
          commercial: "hsl(var(--chart-3))",
          land: "hsl(var(--chart-4))",
          Other: "hsl(var(--chart-5))",
        };

        const propertyTypes = Object.entries(typeCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: typeColors[name] || "hsl(var(--chart-5))",
        }));

        // Recent activity
        const activities: RecentActivity[] = (bookingRequestsData || []).map(b => ({
          id: b.created_at,
          type: "booking" as const,
          title: "Booking Request",
          description: `Status: ${b.status}`,
          time: format(new Date(b.created_at), "MMM dd, HH:mm"),
          status: b.status,
        }));

        setMonthlyData(chartData);
        setRegionData(topRegions);
        setPropertyTypeData(propertyTypes);
        setRecentActivity(activities);
        setStats({
          users: usersCount || 0,
          properties: propertiesCount || 0,
          availableProperties: availablePropertiesCount || 0,
          rentedProperties: rentedPropertiesCount || 0,
          activeLeases: activeLeasesCount || 0,
          serviceProviders: serviceProvidersCount || 0,
          approvedProviders: approvedProvidersCount || 0,
          pendingProviders: pendingProvidersCount || 0,
          vendors: vendorsCount || 0,
          approvedVendors: approvedVendorsCount || 0,
          pendingVendors: pendingVendorsCount || 0,
          bookingRequests: bookingRequestsCount || 0,
          pendingBookings: pendingBookingsCount || 0,
          approvedBookings: approvedBookingsCount || 0,
          rejectedBookings: rejectedBookingsCount || 0,
          viewingSchedules: viewingSchedulesCount || 0,
          pendingViewings: pendingViewingsCount || 0,
          confirmedViewings: confirmedViewingsCount || 0,
          completedViewings: completedViewingsCount || 0,
          reviews: reviewsCount || 0,
          totalRevenue,
          totalProfit,
          monthlyProfit,
          lastMonthProfit,
          profitGrowth,
          pendingPayments: pendingAmount,
          verifiedPayments: verifiedPayments?.length || 0,
          verifiedUsers: verifiedUsersCount || 0,
          pendingVerifications: pendingVerificationsCount || 0,
          newUsersThisMonth: newUsersThisMonthCount || 0,
          newUsersLastMonth: newUsersLastMonthCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Real-time subscriptions for notifications
  useEffect(() => {
    // Subscribe to new booking requests
    const bookingsChannel = supabase
      .channel('admin-bookings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_requests'
        },
        (payload) => {
          console.log('New booking request:', payload);
          const description = `A new ${payload.new.service_type || 'service'} booking has been submitted`;
          toast.info("New Booking Request", {
            description,
            icon: <Calendar className="h-4 w-4" />,
          });
          addNotification({
            type: "booking",
            title: "New Booking Request",
            description,
          });
          // Update stats
          setStats(prev => prev ? {
            ...prev,
            bookingRequests: prev.bookingRequests + 1,
            pendingBookings: prev.pendingBookings + 1
          } : prev);
        }
      )
      .subscribe();

    // Subscribe to new payments
    const paymentsChannel = supabase
      .channel('admin-payments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rental_payments'
        },
        (payload) => {
          console.log('New payment:', payload);
          const amount = payload.new.amount || 0;
          const description = `Payment of $${amount.toLocaleString()} has been recorded`;
          toast.success("New Payment Received", {
            description,
            icon: <DollarSign className="h-4 w-4" />,
          });
          addNotification({
            type: "payment",
            title: "New Payment Received",
            description,
          });
          // Update pending payments if unverified
          if (payload.new.verification_status === 'unverified') {
            setStats(prev => prev ? {
              ...prev,
              pendingPayments: prev.pendingPayments + amount
            } : prev);
          }
        }
      )
      .subscribe();

    // Subscribe to new user registrations
    const usersChannel = supabase
      .channel('admin-users')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('New user registered:', payload);
          const description = `${payload.new.full_name || 'A new user'} has joined the platform`;
          toast.info("New User Registration", {
            description,
            icon: <Users className="h-4 w-4" />,
          });
          addNotification({
            type: "user",
            title: "New User Registration",
            description,
          });
          // Update stats
          setStats(prev => prev ? {
            ...prev,
            users: prev.users + 1,
            newUsersThisMonth: prev.newUsersThisMonth + 1
          } : prev);
        }
      )
      .subscribe();

    // Subscribe to new viewing schedules
    const viewingsChannel = supabase
      .channel('admin-viewings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'viewing_schedules'
        },
        (payload) => {
          console.log('New viewing scheduled:', payload);
          const description = `A property viewing has been scheduled for ${format(new Date(payload.new.scheduled_date), 'MMM dd, yyyy')}`;
          toast.info("New Viewing Scheduled", {
            description,
            icon: <Eye className="h-4 w-4" />,
          });
          addNotification({
            type: "viewing",
            title: "New Viewing Scheduled",
            description,
          });
          // Update stats
          setStats(prev => prev ? {
            ...prev,
            viewingSchedules: prev.viewingSchedules + 1,
            pendingViewings: prev.pendingViewings + 1
          } : prev);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(viewingsChannel);
    };
  }, [addNotification]);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "booking": return <Calendar className="h-4 w-4 text-blue-500" />;
      case "payment": return <DollarSign className="h-4 w-4 text-green-500" />;
      case "user": return <Users className="h-4 w-4 text-purple-500" />;
      case "viewing": return <Eye className="h-4 w-4 text-amber-500" />;
    }
  };

  const formatNotificationTime = (time: Date) => {
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return format(time, "MMM dd, HH:mm");
  };

  const userGrowth = stats?.newUsersLastMonth && stats.newUsersLastMonth > 0
    ? ((stats.newUsersThisMonth - stats.newUsersLastMonth) / stats.newUsersLastMonth) * 100
    : stats?.newUsersThisMonth ? 100 : 0;

  const bookingApprovalRate = stats?.bookingRequests && stats.bookingRequests > 0
    ? ((stats.approvedBookings / stats.bookingRequests) * 100).toFixed(1)
    : "0";

  const viewingConversionRate = stats?.viewingSchedules && stats.viewingSchedules > 0
    ? ((stats.completedViewings / stats.viewingSchedules) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Business Dashboard</h2>
          <p className="text-muted-foreground mt-2">Real-time overview of your platform performance</p>
        </div>
        
        {/* Notification Bell */}
        <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold">Notifications</h4>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                      Mark all read
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearNotifications} className="text-xs h-7">
                      Clear all
                    </Button>
                  </>
                )}
              </div>
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Bell className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs">Real-time updates will appear here</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-muted/30" : ""}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatNotificationTime(notification.time)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <>
                <div className="text-2xl font-bold">${stats?.totalRevenue?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Platform profit: ${stats?.totalProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <>
                <div className="text-2xl font-bold">${stats?.monthlyProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0}</div>
                <p className={`text-xs flex items-center gap-1 ${stats?.profitGrowth && stats.profitGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {stats?.profitGrowth && stats.profitGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(stats?.profitGrowth || 0).toFixed(1)}% vs last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Revenue</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <>
                <div className="text-2xl font-bold">${stats?.pendingPayments?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting verification</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Leases</CardTitle>
            <FileCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.activeLeases || 0}</div>
                <p className="text-xs text-muted-foreground">{stats?.rentedProperties || 0} rented properties</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bookings & Viewings KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Booking Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stats?.bookingRequests || 0}</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />{stats?.pendingBookings || 0} pending
                  </Badge>
                  <Badge variant="default" className="text-xs bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />{stats?.approvedBookings || 0} approved
                  </Badge>
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />{stats?.rejectedBookings || 0} rejected
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{bookingApprovalRate}% approval rate</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              Property Viewings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stats?.viewingSchedules || 0}</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />{stats?.pendingViewings || 0} pending
                  </Badge>
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />{stats?.confirmedViewings || 0} confirmed
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{viewingConversionRate}% completed rate</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-500" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stats?.users || 0}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    +{stats?.newUsersThisMonth || 0} this month
                  </Badge>
                  <span className={`text-xs flex items-center ${userGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {userGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(userGrowth).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{stats?.verifiedUsers || 0} verified users</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {(stats?.pendingBookings || 0) + (stats?.pendingViewings || 0) + (stats?.pendingProviders || 0) + (stats?.pendingVendors || 0) + (stats?.pendingVerifications || 0)}
                </div>
                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                  <span>{stats?.pendingVerifications || 0} verifications</span>
                  <span>•</span>
                  <span>{stats?.pendingProviders || 0} providers</span>
                  <span>•</span>
                  <span>{stats?.pendingVendors || 0} vendors</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
            <CardDescription>Last 6 months performance</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="profit" name="Profit" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Properties by Type</CardTitle>
            <CardDescription>Distribution of listings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[300px] w-full" /> : propertyTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={propertyTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {propertyTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No property data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Properties & Partners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Home className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.properties || 0}</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{stats?.availableProperties || 0} available</Badge>
                  <Badge variant="secondary" className="text-xs">{stats?.rentedProperties || 0} rented</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.serviceProviders || 0}</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="default" className="text-xs bg-green-500">{stats?.approvedProviders || 0} active</Badge>
                  <Badge variant="secondary" className="text-xs">{stats?.pendingProviders || 0} pending</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <Store className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.vendors || 0}</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="default" className="text-xs bg-green-500">{stats?.approvedVendors || 0} active</Badge>
                  <Badge variant="secondary" className="text-xs">{stats?.pendingVendors || 0} pending</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <UserCheck className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.reviews || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Customer feedback</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Regions */}
      {regionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Top Regions by Properties
            </CardTitle>
            <CardDescription>Geographic distribution of listings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[200px] w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="properties" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
