import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, Home, Bed, Bath, Maximize, Calendar, 
  Tag, CheckCircle, ArrowLeft, DollarSign 
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

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
    duration: type === "rent" ? "Minimum 12 months" : "N/A",
    images: ["/placeholder.svg"],
  };
};

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  
  // Get listing type from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const listingType = searchParams.get("type") || "sale";
  
  const property = getPropertyById(id || "1", listingType);
  const isRental = listingType === "rent";

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
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Price */}
            <Card>
              <CardContent className="pt-6">
                <h1 className="text-3xl font-bold mb-4">{property.title}</h1>
                <div className="flex items-center gap-2 text-3xl font-bold text-primary mb-4">
                  <DollarSign className="h-8 w-8" />
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
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Bed className="h-6 w-6 mb-2 text-primary" />
                    <span className="font-semibold">{property.numberOfRooms}</span>
                    <span className="text-sm text-muted-foreground">Bedrooms</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Bath className="h-6 w-6 mb-2 text-primary" />
                    <span className="font-semibold">{property.numberOfWashrooms}</span>
                    <span className="text-sm text-muted-foreground">Bathrooms</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Maximize className="h-6 w-6 mb-2 text-primary" />
                    <span className="font-semibold">{property.propertySize}</span>
                    <span className="text-sm text-muted-foreground">Sq Ft</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                    <Home className="h-6 w-6 mb-2 text-primary" />
                    <span className="font-semibold text-center text-sm">{property.apartmentType}</span>
                  </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Furnishing Type</span>
                    <span className="font-medium">{property.furnishingType}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Compound Type</span>
                    <span className="font-medium">{property.compoundType}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Region</span>
                    <span className="font-medium">{property.region}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">City</span>
                    <span className="font-medium">{property.city}</span>
                  </div>
                  {isRental && (
                    <div className="flex justify-between py-2 col-span-full">
                      <span className="text-muted-foreground">Minimum Duration</span>
                      <span className="font-medium">{property.duration}</span>
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
                  <div className="text-center py-4">
                    <p className="text-2xl font-bold text-primary mb-2">
                      {isRental ? `${formatPrice(property.price)}/month` : formatPrice(property.price)}
                    </p>
                    {isRental && (
                      <p className="text-sm text-muted-foreground">
                        Minimum {property.duration}
                      </p>
                    )}
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate(`/checkout?property=${id}&type=${listingType}`)}
                  >
                    {isRental ? "Schedule Viewing" : "Make an Offer"}
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    Contact Agent
                  </Button>

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

      <Footer />
    </div>
  );
};

export default PropertyDetails;
