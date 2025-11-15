import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bed, Bath, Square, Heart, Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PropertyFeatures {
  descriptions?: string[];
  amenities?: string[];
  facilities?: string[];
}

interface PropertyCardProps {
  id: number;
  image: string;
  title: string;
  price: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  location: string;
  type: "rent" | "sale";
  features?: PropertyFeatures;
  onSelect?: () => void;
}

const PropertyCard = ({
  id,
  image,
  title,
  price,
  beds,
  baths,
  sqft,
  location,
  type,
  features,
  onSelect,
}: PropertyCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const inWishlist = isInWishlist(id);
  
  const priceValue = parseFloat(price.replace(/[^0-9.-]+/g, ""));
  
  const hasFeatures = features && (
    features.descriptions?.length || 
    features.amenities?.length || 
    features.facilities?.length
  );

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(id);
      toast({
        title: "Removed from wishlist",
        description: `${title} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist({
        id,
        type: type === "rent" ? "rental" : "sale",
        title,
        price,
        location,
        image,
      });
      toast({
        title: "Added to wishlist",
        description: `${title} has been added to your wishlist.`,
      });
    }
  };

  const handleNavigateToDetails = () => {
    navigate(`/property/${id}?type=${type}`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
      <div 
        className="relative h-48 overflow-hidden cursor-pointer"
        onClick={handleNavigateToDetails}
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
          {type === "rent" ? "For Rent" : "For Sale"}
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 z-10"
          onClick={(e) => {
            e.stopPropagation();
            handleWishlistToggle();
          }}
        >
          <Heart
            className="h-4 w-4"
            fill={inWishlist ? "currentColor" : "none"}
          />
        </Button>
      </div>
      <CardContent className="pt-4">
        <h3 
          className="font-semibold text-lg mb-2 cursor-pointer hover:text-primary transition-colors"
          onClick={handleNavigateToDetails}
        >
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-3">{location}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          {beds && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{beds} beds</span>
            </div>
          )}
          {baths && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{baths} baths</span>
            </div>
          )}
          {sqft && (
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              <span>{sqft} sqft</span>
            </div>
          )}
        </div>
        
        {hasFeatures && (
          <div className="mb-4">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  View Features
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{title} - Features</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  {features.descriptions && features.descriptions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-3">Property Descriptions</h4>
                      <div className="flex flex-wrap gap-2">
                        {features.descriptions.map((desc) => (
                          <Badge key={desc} variant="secondary" className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {desc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {features.amenities && features.amenities.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-3">Amenities</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {features.amenities.map((amenity) => (
                          <div key={amenity} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-accent" />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {features.facilities && features.facilities.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-3">Facilities</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {features.facilities.map((facility) => (
                          <div key={facility} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-accent" />
                            <span>{facility}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
        
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold text-primary">
              {formatPrice(priceValue)}
            </span>
            {type === "rent" && (
              <span className="text-muted-foreground text-sm ml-1">/month</span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
