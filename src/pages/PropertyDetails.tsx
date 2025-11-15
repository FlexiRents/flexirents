import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReviewForm } from "@/components/ReviewForm";
import ReviewCard from "@/components/ReviewCard";
import RatingStars from "@/components/RatingStars";
import { 
  MapPin, Home, Bed, Bath, Maximize, Calendar, 
  Tag, CheckCircle, ArrowLeft, Heart, Star, Ruler, 
  TreePine, Building2, ParkingCircle
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/contexts/WishlistContext";
import { supabase } from "@/integrations/supabase/client";

// This would normally come from a database or API
const getPropertyById = (id: string, type: string) => {
  // Mock data - in production this would fetch from your database
  return {
    id,
    title: "Luxury Family Home",
    listingType: type === "sale" ? "For Sale" : "For Rent",
    description: "Beautiful and spacious property with modern amenities. This stunning home features high-end finishes, an open floor plan, and is located in a highly sought-after neighborhood. Perfect for families looking for comfort and convenience.",
    region: "Greater Accra",
    city: "Accra",
    landmark: "Near Accra Mall",
    price: type === "sale" ? 450000 : 2500,
    apartmentType: "Single Family Home",
    numberOfRooms: 4,
    propertySize: 2800,
    furnishingType: "Fully Furnished",
    compoundType: "Gated Community",
    numberOfWashrooms: 3,
    tags: ["Newly Renovated", "Move-in Ready", "Open Floor Plan"],
    facilities: ["24/7 Security", "Community Center", "Playground", "Swimming Pool"],
    amenities: ["Air Conditioning", "Parking Space", "Garden/Yard", "Storage Unit"],
    googleLocation: "5.6037° N, 0.1870° W",
    duration: type === "rent" ? "12 months" : "N/A",
    images: ["/placeholder.svg"],
  };
};

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<{
    id: string;
    rating: number;
    text?: string;
  } | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  
  const inWishlist = isInWishlist(id || "1");
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    message: "",
  });
  
  // Get listing type from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const listingType = searchParams.get("type") || "sale";
  
  const property = getPropertyById(id || "1", listingType);
  const isRental = listingType === "rent";

  // Get contextual features based on property type
  const getKeyFeatures = () => {
    const propertyType = property.apartmentType?.toLowerCase() || '';
    
    // Land/Plot properties
    if (propertyType.includes('land') || propertyType.includes('plot')) {
      return [
        {
          icon: <Maximize className="h-6 w-6 mb-2 text-primary" />,
          value: property.propertySize,
          label: "Sq Ft",
          subLabel: `${(property.propertySize / 43560).toFixed(2)} acres`
        },
        {
          icon: <TreePine className="h-6 w-6 mb-2 text-primary" />,
          value: "Residential",
          label: "Zoning"
        },
        {
          icon: <MapPin className="h-6 w-6 mb-2 text-primary" />,
          value: property.compoundType || "Fenced",
          label: "Property Status"
        },
        {
          icon: <Ruler className="h-6 w-6 mb-2 text-primary" />,
          value: "Level Terrain",
          label: "Land Type"
        }
      ];
    }
    
    // Commercial properties
    if (propertyType.includes('commercial') || propertyType.includes('office') || propertyType.includes('warehouse')) {
      return [
        {
          icon: <Maximize className="h-6 w-6 mb-2 text-primary" />,
          value: property.propertySize,
          label: "Sq Ft"
        },
        {
          icon: <Building2 className="h-6 w-6 mb-2 text-primary" />,
          value: property.numberOfRooms || "Multiple",
          label: "Units/Floors"
        },
        {
          icon: <ParkingCircle className="h-6 w-6 mb-2 text-primary" />,
          value: property.numberOfWashrooms || "Available",
          label: "Parking Spaces"
        },
        {
          icon: <Home className="h-6 w-6 mb-2 text-primary" />,
          value: property.apartmentType,
          label: "Type"
        }
      ];
    }
    
    // Default: Residential (Apartments, Houses, etc.)
    return [
      {
        icon: <Bed className="h-6 w-6 mb-2 text-primary" />,
        value: property.numberOfRooms,
        label: "Bedrooms"
      },
      {
        icon: <Bath className="h-6 w-6 mb-2 text-primary" />,
        value: property.numberOfWashrooms,
        label: "Bathrooms"
      },
      {
        icon: <Maximize className="h-6 w-6 mb-2 text-primary" />,
        value: property.propertySize,
        label: "Sq Ft"
      },
      {
        icon: <Home className="h-6 w-6 mb-2 text-primary" />,
        value: property.apartmentType,
        label: "Type"
      }
    ];
  };

  const keyFeatures = getKeyFeatures();

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      
      setIsLoadingReviews(true);
      try {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles:reviewer_user_id (
              full_name
            )
          `)
          .eq('target_type', 'property')
          .eq('target_id', id)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        setReviews(reviewsData || []);
        setReviewCount(reviewsData?.length || 0);
        
        if (reviewsData && reviewsData.length > 0) {
          const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
          setAverageRating(Math.round(avg * 10) / 10);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

  const handleReviewSuccess = () => {
    setEditingReview(null);
    // Reload reviews after successful submission
    const fetchReviews = async () => {
      if (!id) return;
      
      try {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles:reviewer_user_id (
              full_name
            )
          `)
          .eq('target_type', 'property')
          .eq('target_id', id)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        setReviews(reviewsData || []);
        setReviewCount(reviewsData?.length || 0);
        
        if (reviewsData && reviewsData.length > 0) {
          const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
          setAverageRating(Math.round(avg * 10) / 10);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  };

  const handleEditReview = (reviewId: string, rating: number, reviewText?: string) => {
    setEditingReview({ id: reviewId, rating, text: reviewText });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('reviewer_user_id', user.id);

      if (error) throw error;

      toast({
        title: "Review Deleted",
        description: "Your review has been deleted successfully.",
      });

      handleReviewSuccess();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProceedToPayment = () => {
    if (!user) {
      // Store the current page as the return URL
      toast({
        title: "Login Required",
        description: "Please log in to proceed with payment.",
      });
      navigate('/auth', { 
        state: { 
          returnUrl: location.pathname + location.search 
        } 
      });
      return;
    }

    // User is authenticated, proceed to checkout
    navigate('/checkout', {
      state: {
        type: isRental ? 'rental' : 'sale',
        property: {
          id: property.id,
          title: property.title,
          price: `$${property.price}`,
          location: `${property.city}, ${property.region}`,
          image: property.images[0]
        }
      }
    });
  };

  const handleWishlistToggle = async () => {
    if (inWishlist) {
      await removeFromWishlist(id || "1");
      toast({
        title: "Removed from wishlist",
        description: `${property.title} has been removed from your wishlist.`,
      });
    } else {
      await addToWishlist({
        id: id || "1",
        type: isRental ? "rental" : "sale",
        title: property.title,
        price: `$${property.price}`,
        location: `${property.city}, ${property.region}`,
        image: property.images[0],
      });
      toast({
        title: "Added to wishlist",
        description: `${property.title} has been added to your wishlist.`,
      });
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Viewing scheduled!",
      description: `We'll contact you at ${scheduleForm.email} to confirm your viewing for ${property.title}.`,
    });
    setShowSchedule(false);
    setScheduleForm({
      name: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Listings
        </Button>

        {/* Hero Image */}
        <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden mb-8">
          <img 
            src={property.images[0]} 
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <Badge className="absolute top-4 right-4 text-lg px-4 py-2">
            {property.listingType}
          </Badge>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 left-4 z-10"
            onClick={handleWishlistToggle}
          >
            <Heart
              className="h-5 w-5"
              fill={inWishlist ? "currentColor" : "none"}
            />
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Price */}
            <Card>
              <CardContent className="pt-6">
                <h1 className="text-3xl font-bold mb-4">{property.title}</h1>
                <div className="text-3xl font-bold text-primary mb-4">
                  {isRental ? `${formatPrice(property.price)}/month` : formatPrice(property.price)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{property.city}, {property.region}</span>
                  {property.landmark && <span>• {property.landmark}</span>}
                </div>
              </CardContent>
            </Card>

            {/* Key Features */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Key Features</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {keyFeatures.map((feature, index) => (
                    <div key={index} className="flex flex-col items-center p-4 bg-muted rounded-lg">
                      {feature.icon}
                      <span className="font-semibold text-center">{feature.value}</span>
                      <span className="text-sm text-muted-foreground text-center">{feature.label}</span>
                      {feature.subLabel && (
                        <span className="text-xs text-muted-foreground mt-1">{feature.subLabel}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description}
                </p>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Property Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>{property.furnishingType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>{property.compoundType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>{property.region}, {property.city}</span>
                  </div>
                  {isRental && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Rent duration: {property.duration}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {property.tags.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {property.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Facilities */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Facilities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {property.facilities.map((facility, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>{facility}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </h2>
                <p className="text-muted-foreground mb-2">
                  <span className="font-medium">Coordinates:</span> {property.googleLocation}
                </p>
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center mt-4">
                  <span className="text-muted-foreground">Map integration coming soon</span>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Reviews
                    </h2>
                    {reviewCount > 0 && (
                      <div className="flex items-center gap-2">
                        <RatingStars rating={averageRating} />
                        <span className="text-sm text-muted-foreground">
                          {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button onClick={() => setShowReviewForm(true)}>
                    Post a Review
                  </Button>
                </div>

                {isLoadingReviews ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No reviews yet. Be the first to review this property!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        reviewId={review.id}
                        reviewerName={review.profiles?.full_name || 'Anonymous'}
                        reviewerUserId={review.reviewer_user_id}
                        rating={review.rating}
                        reviewText={review.review_text}
                        createdAt={review.created_at}
                        currentUserId={user?.id}
                        onEdit={handleEditReview}
                        onDelete={handleDeleteReview}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">
                  {isRental ? "Schedule a Viewing" : "Contact Agent"}
                </h2>
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Viewing
                      </Button>
                    </DialogTrigger>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleProceedToPayment}
                  >
                    Proceed to Payment
                  </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule a Viewing for {property.title}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleScheduleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            required
                            value={scheduleForm.name}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={scheduleForm.email}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, email: e.target.value })}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            required
                            value={scheduleForm.phone}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, phone: e.target.value })}
                            placeholder="+233 XX XXX XXXX"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="date">Preferred Date</Label>
                            <Input
                              id="date"
                              type="date"
                              required
                              value={scheduleForm.date}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="time">Preferred Time</Label>
                            <Input
                              id="time"
                              type="time"
                              required
                              value={scheduleForm.time}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Additional Message (Optional)</Label>
                          <Textarea
                            id="message"
                            value={scheduleForm.message}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, message: e.target.value })}
                            placeholder="Any specific requirements or questions..."
                            rows={3}
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Confirm Schedule
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Separator className="my-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Available Now</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{property.apartmentType}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ReviewForm
        targetType="property"
        targetId={id || "1"}
        onSuccess={handleReviewSuccess}
        open={showReviewForm}
        onOpenChange={(open) => {
          setShowReviewForm(open);
          if (!open) setEditingReview(null);
        }}
        targetName={property.title}
        editMode={!!editingReview}
        existingReviewId={editingReview?.id}
        existingRating={editingReview?.rating}
        existingReviewText={editingReview?.text}
      />

      <Footer />
    </div>
  );
};

export default PropertyDetails;
