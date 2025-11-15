import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Calendar, 
  Star, 
  MessageSquare, 
  Heart, 
  TrendingUp, 
  Clock,
  User,
  Mail,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import RatingStars from "@/components/RatingStars";

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalReviews: number;
  averageRating: number;
  unreadMessages: number;
}

interface RecentBooking {
  id: string;
  service_type: string;
  booking_date: string;
  status: string;
  provider_name: string;
}

interface RecentReview {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer_name: string | null;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalReviews: 0,
    averageRating: 0,
    unreadMessages: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null }>({ full_name: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchProfile(),
        fetchStats(),
        fetchRecentBookings(),
        fetchRecentReviews(),
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user?.id)
      .maybeSingle();

    if (data) setProfile(data);
  };

  const fetchStats = async () => {
    // Fetch bookings stats
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("status")
      .eq("user_id", user?.id);

    // Fetch reviews stats
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("rating")
      .eq("target_type", "client")
      .eq("target_id", user?.id);

    // Fetch unread messages count
    const { count: unreadCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .neq("sender_id", user?.id || "")
      .eq("read", false);

    const totalBookings = bookingsData?.length || 0;
    const pendingBookings = bookingsData?.filter(b => b.status === "pending").length || 0;
    const completedBookings = bookingsData?.filter(b => b.status === "completed").length || 0;
    const totalReviews = reviewsData?.length || 0;
    const averageRating = totalReviews > 0
      ? reviewsData!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    setStats({
      totalBookings,
      pendingBookings,
      completedBookings,
      totalReviews,
      averageRating,
      unreadMessages: unreadCount || 0,
    });
  };

  const fetchRecentBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("id, service_type, booking_date, status, service_provider_id")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (data) {
      const enriched = await Promise.all(
        data.map(async (booking) => {
          const { data: provider } = await supabase
            .from("service_provider_registrations")
            .select("provider_name")
            .eq("id", booking.service_provider_id)
            .maybeSingle();

          return {
            ...booking,
            provider_name: provider?.provider_name || "Unknown Provider",
          };
        })
      );

      setRecentBookings(enriched);
    }
  };

  const fetchRecentReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, review_text, created_at, reviewer_user_id")
      .eq("target_type", "client")
      .eq("target_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (data) {
      const enriched = await Promise.all(
        data.map(async (review) => {
          const { data: reviewer } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", review.reviewer_user_id)
            .maybeSingle();

          return {
            ...review,
            reviewer_name: reviewer?.full_name || null,
          };
        })
      );

      setRecentReviews(enriched);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return user?.email?.[0].toUpperCase() || "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <p className="text-center text-muted-foreground">Loading dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back{profile.full_name ? `, ${profile.full_name}` : ""}!
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
                    <p className="text-3xl font-bold">{stats.totalBookings}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-3xl font-bold">{stats.pendingBookings}</p>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reviews</p>
                    <p className="text-3xl font-bold">{stats.totalReviews}</p>
                  </div>
                  <Star className="h-10 w-10 text-yellow-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Unread Messages</p>
                    <p className="text-3xl font-bold">{stats.unreadMessages}</p>
                  </div>
                  <MessageSquare className="h-10 w-10 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rating Overview */}
          {stats.totalReviews > 0 && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">Your Client Rating</p>
                    <div className="flex items-center gap-3">
                      <RatingStars rating={stats.averageRating} size={24} />
                      <span className="text-2xl font-bold">
                        {stats.averageRating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  </div>
                  <TrendingUp className="h-12 w-12 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Button
              variant="outline"
              className="h-auto py-6 justify-start"
              onClick={() => navigate("/flexi-assist")}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Book a Service</p>
                  <p className="text-sm text-muted-foreground">Find service providers</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 justify-start"
              onClick={() => navigate("/my-bookings")}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">View Bookings</p>
                  <p className="text-sm text-muted-foreground">Manage your bookings</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 justify-start"
              onClick={() => navigate("/profile")}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Edit Profile</p>
                  <p className="text-sm text-muted-foreground">Update your info</p>
                </div>
              </div>
            </Button>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Bookings</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/my-bookings")}>
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <CardDescription>Your latest service bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {recentBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No bookings yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => navigate("/my-bookings")}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{booking.service_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.provider_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(booking.booking_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Reviews</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <CardDescription>What service providers say about you</CardDescription>
              </CardHeader>
              <CardContent>
                {recentReviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentReviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">
                            {review.reviewer_name || "Service Provider"}
                          </p>
                          <RatingStars rating={review.rating} size={14} />
                        </div>
                        {review.review_text && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {review.review_text}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(review.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
