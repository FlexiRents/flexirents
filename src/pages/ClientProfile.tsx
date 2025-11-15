import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Phone, 
  Star, 
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import RatingStars from "@/components/RatingStars";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  booking_id: string | null;
  profiles?: {
    full_name: string | null;
  };
}

interface Profile {
  full_name: string | null;
  phone: string | null;
}

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

export default function ClientProfile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ full_name: null, phone: null });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalReviews: 0,
    averageRating: 0,
    unreadMessages: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchProfile(),
        fetchReviews(),
        fetchStats(),
        fetchRecentBookings(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("target_type", "client")
        .eq("target_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enrichedReviews = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", review.reviewer_user_id)
            .maybeSingle();

          return {
            ...review,
            profiles: profileData,
          };
        })
      );

      setReviews(enrichedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchStats = async () => {
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("status")
      .eq("user_id", user?.id);

    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("rating")
      .eq("target_type", "client")
      .eq("target_id", user?.id);

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      fetchProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
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
          <p className="text-center text-muted-foreground">Loading profile...</p>
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
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-3xl font-bold mb-2">
                    {profile.full_name || "Your Profile"}
                  </h1>
                  <div className="flex flex-col sm:flex-row items-center gap-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{user?.email}</span>
                    </div>
                    {profile.phone && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{profile.phone}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {stats.totalReviews > 0 && (
                    <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                      <RatingStars rating={stats.averageRating} />
                      <span className="text-sm text-muted-foreground">
                        ({stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

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
                  <p className="font-semibold">View All Bookings</p>
                  <p className="text-sm text-muted-foreground">Manage your bookings</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 justify-start"
              onClick={() => navigate("/wishlist")}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Wishlist</p>
                  <p className="text-sm text-muted-foreground">View saved properties</p>
                </div>
              </div>
            </Button>
          </div>

          {/* Recent Activity & Tabs */}
          <Tabs defaultValue="activity" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 mx-auto">
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="reviews">My Reviews</TabsTrigger>
              <TabsTrigger value="settings">Account Settings</TabsTrigger>
            </TabsList>

            {/* Recent Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
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
                    <CardTitle>Latest Reviews</CardTitle>
                    <CardDescription>Recent feedback from service providers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reviews.slice(0, 3).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No reviews yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.slice(0, 3).map((review) => (
                          <div
                            key={review.id}
                            className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-sm">
                                {review.profiles?.full_name || "Service Provider"}
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
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Reviews from Service Providers</CardTitle>
                  <CardDescription>
                    See what service providers have said about working with you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No reviews yet. Complete bookings to receive reviews from service providers.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium">
                                  {review.profiles?.full_name || "Service Provider"}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <RatingStars rating={review.rating} size={16} />
                                  <span className="text-sm text-muted-foreground">
                                    {review.rating}/5
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(review.created_at), "MMM d, yyyy")}
                              </div>
                            </div>
                            {review.review_text && (
                              <p className="text-muted-foreground">{review.review_text}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name
                        </div>
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </div>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">
                        Email cannot be changed. Contact support if you need to update it.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </div>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        maxLength={20}
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit" disabled={updating} className="flex-1">
                        {updating ? "Updating..." : "Update Profile"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFullName(profile.full_name || "");
                          setPhone(profile.phone || "");
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
