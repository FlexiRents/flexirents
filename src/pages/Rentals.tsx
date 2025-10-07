import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import property1br from "@/assets/property-1br.jpg";
import propertyApartment from "@/assets/property-apartment.jpg";
import property3br from "@/assets/property-3br.jpg";

const rentals = [
  {
    id: 1,
    image: property1br,
    title: "Modern 1 Bedroom Apartment",
    price: "$1,200/month",
    beds: 1,
    baths: 1,
    sqft: 650,
    location: "Downtown District",
    type: "rent" as const,
    features: {
      descriptions: ["Newly Renovated", "Move-in Ready", "High Ceilings"],
      amenities: ["Air Conditioning", "Heating", "Balcony/Terrace", "Parking Space"],
      facilities: ["24/7 Security", "Elevator", "Package Room"],
    },
  },
  {
    id: 2,
    image: propertyApartment,
    title: "Luxury Studio Apartment",
    price: "$1,500/month",
    beds: 1,
    baths: 1,
    sqft: 800,
    location: "City Center",
    type: "rent" as const,
    features: {
      descriptions: ["Furnished", "Corner Unit", "Natural Light"],
      amenities: ["Swimming Pool", "Gym/Fitness Center", "Air Conditioning", "Storage Unit"],
      facilities: ["Concierge Service", "Business Center", "Rooftop Deck"],
    },
  },
  {
    id: 3,
    image: property3br,
    title: "Spacious 2 Bedroom House",
    price: "$2,200/month",
    beds: 2,
    baths: 2,
    sqft: 1400,
    location: "Suburban Area",
    type: "rent" as const,
    features: {
      descriptions: ["Pet Friendly", "Open Floor Plan", "Garden/Yard"],
      amenities: ["Laundry Room", "Parking Space", "Garden/Yard", "Storage Unit"],
      facilities: ["Guest Parking", "Playground", "BBQ Area"],
    },
  },
  {
    id: 4,
    image: property1br,
    title: "Cozy 1 Bedroom Condo",
    price: "$1,350/month",
    beds: 1,
    baths: 1,
    sqft: 700,
    location: "Midtown",
    type: "rent" as const,
    features: {
      descriptions: ["Move-in Ready", "Hardwood Floors"],
      amenities: ["Air Conditioning", "Parking Space", "Security System"],
      facilities: ["Elevator", "Bike Storage"],
    },
  },
  {
    id: 5,
    image: propertyApartment,
    title: "Premium 2 Bedroom Apartment",
    price: "$2,800/month",
    beds: 2,
    baths: 2,
    sqft: 1200,
    location: "Waterfront",
    type: "rent" as const,
    features: {
      descriptions: ["Newly Renovated", "High Ceilings", "Natural Light"],
      amenities: ["Swimming Pool", "Gym/Fitness Center", "Balcony/Terrace", "Parking Space"],
      facilities: ["24/7 Security", "Concierge Service", "Rooftop Deck", "EV Charging"],
    },
  },
  {
    id: 6,
    image: property3br,
    title: "Family 3 Bedroom Home",
    price: "$3,200/month",
    beds: 3,
    baths: 2.5,
    sqft: 1800,
    location: "Residential District",
    type: "rent" as const,
    features: {
      descriptions: ["Pet Friendly", "Open Floor Plan", "Hardwood Floors"],
      amenities: ["Laundry Room", "Parking Space", "Garden/Yard", "Air Conditioning"],
      facilities: ["Playground", "Community Center", "Guest Parking"],
    },
  },
];

const Rentals = () => {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [priceFilter, setPriceFilter] = useState("all");
  const [bedroomFilter, setBedroomFilter] = useState("all");

  const handleSelectProperty = (propertyId: number) => {
    setSelectedProperty(propertyId);
    const property = rentals.find((p) => p.id === propertyId);
    navigate("/checkout", { state: { type: "rental", property } });
  };

  const filteredRentals = rentals.filter((rental) => {
    const price = parseInt(rental.price.replace(/[^0-9]/g, ""));
    
    // Price filter
    if (priceFilter === "under1500" && price >= 1500) return false;
    if (priceFilter === "1500-2500" && (price < 1500 || price >= 2500)) return false;
    if (priceFilter === "over2500" && price < 2500) return false;
    
    // Bedroom filter
    if (bedroomFilter === "1" && rental.beds !== 1) return false;
    if (bedroomFilter === "2" && rental.beds !== 2) return false;
    if (bedroomFilter === "3+" && rental.beds < 3) return false;
    
    return true;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Properties for Rent</h1>
            <p className="text-muted-foreground text-lg">
              Find your perfect rental home from our curated selection of properties.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card p-6 rounded-lg shadow-[var(--shadow-card)] mb-8">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold">Filter Properties</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range</label>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Prices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under1500">Under $1,500/month</SelectItem>
                    <SelectItem value="1500-2500">$1,500 - $2,500/month</SelectItem>
                    <SelectItem value="over2500">Over $2,500/month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bedrooms</label>
                <Select value={bedroomFilter} onValueChange={setBedroomFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Bedrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bedrooms</SelectItem>
                    <SelectItem value="1">1 Bedroom</SelectItem>
                    <SelectItem value="2">2 Bedrooms</SelectItem>
                    <SelectItem value="3+">3+ Bedrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-muted-foreground">
              Showing {filteredRentals.length} of {rentals.length} properties
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRentals.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                onSelect={() => handleSelectProperty(property.id)}
              />
            ))}
          </div>

          {filteredRentals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No properties match your filters. Try adjusting your criteria.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Rentals;
