import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bed, Bath, Square } from "lucide-react";

interface PropertyCardProps {
  image: string;
  title: string;
  price: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  location: string;
  type: "rent" | "sale";
  onSelect?: () => void;
}

const PropertyCard = ({
  image,
  title,
  price,
  beds,
  baths,
  sqft,
  location,
  type,
  onSelect,
}: PropertyCardProps) => {
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
        <div className="text-2xl font-bold text-primary">{price}</div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="hero" onClick={onSelect}>
          Select Property
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
