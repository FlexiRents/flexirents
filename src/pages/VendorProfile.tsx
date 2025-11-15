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
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Mail, Phone, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VendorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVendorData();
      fetchReviews();
    }
  }, [id]);

  const fetchVendorData = async () => {
    try {
      const { data, error } = await supabase
        .from("vendor_registrations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setVendor(data);

      // Fetch average rating
      const { data: ratingData } = await supabase.rpc("get_average_rating", {
        p_target_type: "vendor",
        p_target_id: id,
      });

      setAverageRating(ratingData || 0);

      // Fetch review count
      const { data: countData } = await supabase.rpc("get_review_count", {
        p_target_type: "vendor",
        p_target_id: id,
      });

      setReviewCount(countData || 0);
    } catch (error: any) {
      console.error("Error fetching vendor:", error);
      toast({
        title: "Error",
        description: "Could not load vendor details.",
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
        .eq("target_type", "vendor")
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

  if (!vendor) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <p className="text-center">Vendor not found.</p>
          <Button onClick={() => navigate("/marketplace")} className="mx-auto block mt-4">
            Back to Marketplace
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
          {/* Vendor Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-bold">{vendor.business_name}</h1>
                  {vendor.status === "approved" && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-lg mb-4">
                  {vendor.business_category}
                </Badge>
                <div className="flex items-center gap-2 mb-4">
                  <RatingStars rating={averageRating} />
                  <span className="text-sm text-muted-foreground">
                    ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button size="lg" variant="outline" onClick={() => setShowReviewForm(!showReviewForm)}>
                  Leave Review
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Vendor Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span>{vendor.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>{vendor.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{vendor.location}, {vendor.region}</span>
                </div>
                {vendor.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <a 
                      href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Contact Person</p>
                  <p className="font-medium">{vendor.contact_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-medium">{vendor.business_category}</p>
                </div>
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
                {vendor.description}
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
                  targetType="vendor"
                  targetId={id!}
                  open={showReviewForm}
                  onOpenChange={setShowReviewForm}
                  onSuccess={() => {
                    setShowReviewForm(false);
                    fetchReviews();
                    fetchVendorData();
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

      <Footer />
    </div>
  );
};

export default VendorProfile;