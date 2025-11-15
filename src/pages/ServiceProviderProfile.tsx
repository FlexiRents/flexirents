import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RatingStars from "@/components/RatingStars";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
import BookingModal from "@/components/BookingModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Mail, Phone, Calendar, Award, Clock, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ServiceProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [provider, setProvider] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProviderData();
      fetchReviews();
    }
  }, [id]);

  const fetchProviderData = async () => {
    try {
      const { data, error } = await supabase
        .from("service_provider_registrations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setProvider(data);

      // Fetch average rating
      const { data: ratingData } = await supabase.rpc("get_average_rating", {
        p_target_type: "service_provider",
        p_target_id: id,
      });

      setAverageRating(ratingData || 0);

      // Fetch review count
      const { data: countData } = await supabase.rpc("get_review_count", {
        p_target_type: "service_provider",
        p_target_id: id,
      });

      setReviewCount(countData || 0);
    } catch (error: any) {
      console.error("Error fetching provider:", error);
      toast({
        title: "Error",
        description: "Could not load provider details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles:reviewer_user_id (
            full_name
          )
        `)
        .eq("target_type", "service_provider")
        .eq("target_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <p className="text-center">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <p className="text-center">Provider not found.</p>
          <Button onClick={() => navigate("/flexi-assist")} className="mx-auto block mt-4">
            Back to Services
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Provider Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-bold">{provider.provider_name}</h1>
                  {provider.status === "approved" && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-lg mb-4">
                  {provider.service_category}
                </Badge>
                <div className="flex items-center gap-2 mb-4">
                  <RatingStars rating={averageRating} />
                  <span className="text-sm text-muted-foreground">
                    ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button size="lg" onClick={() => setShowBookingModal(true)}>
                  Book Now
                </Button>
                <Button size="lg" variant="outline" onClick={() => setShowReviewForm(!showReviewForm)}>
                  Leave Review
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Provider Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span>{provider.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>{provider.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{provider.location}, {provider.region}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{provider.hourly_rate}/hour</span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <span>{provider.years_experience} years experience</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>{provider.availability}</span>
                </div>
                {provider.certifications && (
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>{provider.certifications}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* About Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {provider.description}
              </p>
            </CardContent>
          </Card>

          {/* Review Form */}
          {showReviewForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  targetType="service_provider"
                  targetId={id!}
                  open={showReviewForm}
                  onOpenChange={setShowReviewForm}
                  onSuccess={() => {
                    setShowReviewForm(false);
                    fetchReviews();
                    fetchProviderData();
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Reviews Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Reviews ({reviewCount})
            </h2>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    reviewerName={review.profiles?.full_name || "Anonymous"}
                    rating={review.rating}
                    reviewText={review.review_text}
                    createdAt={review.created_at}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No reviews yet. Be the first to review!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <BookingModal
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
        providerId={id!}
        serviceType={provider.service_category}
        providerName={provider.provider_name}
      />

      <Footer />
    </div>
  );
};

export default ServiceProviderProfile;