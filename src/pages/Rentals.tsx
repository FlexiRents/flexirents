import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Search } from "lucide-react";
import property1br from "@/assets/property-1br.jpg";
import propertyApartment from "@/assets/property-apartment.jpg";
import property3br from "@/assets/property-3br.jpg";
import { ghanaRegions } from "@/data/ghanaLocations";

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
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [bedroomFilter, setBedroomFilter] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  // Load search query from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const handleSelectProperty = (propertyId: number) => {
    setSelectedProperty(propertyId);
    const property = rentals.find((p) => p.id === propertyId);
    navigate("/checkout", { state: { type: "rental", property } });
  };

  const filteredRentals = rentals.filter((rental) => {
    const matchesSearch =
      rental.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.location.toLowerCase().includes(searchQuery.toLowerCase());

    const price = parseInt(rental.price.replace(/[^0-9]/g, ""));
    
    // Price range filter
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    if (price < min || price > max) return false;
    
    // Property type filter (for future use when property types are added)
    // Currently all rentals are apartments, but structure is ready
    
    // Bedroom filter
    if (bedroomFilter === "1" && rental.beds !== 1) return false;
    if (bedroomFilter === "2" && rental.beds !== 2) return false;
    if (bedroomFilter === "3+" && rental.beds < 3) return false;
    
    // Location filter
    if (selectedCity !== "all" && !rental.location.toLowerCase().includes(selectedCity.toLowerCase())) {
      return false;
    }
    
    return matchesSearch;
  });

  const availableCities = selectedRegion === "all" 
    ? [] 
    : ghanaRegions.find(r => r.name === selectedRegion)?.cities || [];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Properties for Rent</h1>
            <p className="text-muted-foreground text-lg mb-6">
              Find your perfect rental home from our curated selection of properties.
            </p>
            
            <div className="max-w-md relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by property name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card p-6 rounded-lg shadow-[var(--shadow-card)] mb-8">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold">Filter Properties</h2>
            </div>
            <div className="space-y-4">
              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range (per month)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Minimum</label>
                    <Input 
                      type="number" 
                      placeholder="Min price"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Maximum</label>
                    <Input 
                      type="number" 
                      placeholder="Max price"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Property Type */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Type</label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="airbnb">AirBnB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bedrooms - only show for residential types */}
                {(propertyType === "all" || propertyType === "apartment" || propertyType === "villa" || propertyType === "airbnb") && (
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
                )}
              </div>

              {/* Location */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <Select value={selectedRegion} onValueChange={(value) => {
                    setSelectedRegion(value);
                    setSelectedCity("all");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Regions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {ghanaRegions.map((region) => (
                        <SelectItem key={region.name} value={region.name}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRegion !== "all" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Cities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {availableCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
