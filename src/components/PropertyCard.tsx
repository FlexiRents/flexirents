import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, Check, Heart, Calendar } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    message: "",
  });
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
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

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Viewing scheduled!",
      description: `We'll contact you at ${scheduleForm.email} to confirm your viewing for ${title}.`,
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
    <Card className="overflow-hidden hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
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
          className="absolute top-4 left-4"
          onClick={handleWishlistToggle}
        >
          <Heart
            className="h-4 w-4"
            fill={inWishlist ? "currentColor" : "none"}
          />
        </Button>
      </div>
      <CardContent className="pt-4">
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
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
        
        <div className="text-2xl font-bold text-primary">{formatPrice(priceValue)}</div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Viewing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule a Viewing - {title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-4">
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
              <Button type="submit" className="w-full" variant="hero">
                Confirm Schedule
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        <Button className="flex-1" variant="hero" onClick={onSelect}>
          Select Property
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
