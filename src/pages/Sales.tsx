import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Search } from "lucide-react";
import property3br from "@/assets/property-3br.jpg";
import propertyCommercial from "@/assets/property-commercial.jpg";
import propertyLand from "@/assets/property-land.jpg";
import { ghanaRegions } from "@/data/ghanaLocations";

const properties = [
  {
    id: 1,
    image: property3br,
    title: "Luxury Family Home",
    price: "$450,000",
    propertyCategory: "residential",
    beds: 4,
    baths: 3,
    sqft: 2800,
    location: "Suburban Heights",
    type: "sale" as const,
    features: {
      descriptions: ["Newly Renovated", "Move-in Ready", "Open Floor Plan"],
      amenities: ["Swimming Pool", "Garden/Yard", "Parking Space", "Air Conditioning"],
      facilities: ["24/7 Security", "Community Center", "Playground"],
    },
  },
  {
    id: 2,
    image: property3br,
    title: "Modern Townhouse",
    price: "$320,000",
    propertyCategory: "residential",
    beds: 3,
    baths: 2.5,
    sqft: 1900,
    location: "Downtown Area",
    type: "sale" as const,
    features: {
      descriptions: ["Newly Renovated", "High Ceilings", "Hardwood Floors"],
      amenities: ["Parking Space", "Balcony/Terrace", "Storage Unit"],
      facilities: ["Elevator", "Bike Storage"],
    },
  },
  {
    id: 3,
    image: propertyCommercial,
    title: "Commercial Office Space",
    price: "$850,000",
    propertyCategory: "commercial",
    sqft: 5000,
    location: "Business District",
    type: "sale" as const,
    features: {
      descriptions: ["Move-in Ready", "High Ceilings", "Natural Light"],
      amenities: ["Parking Space", "Air Conditioning", "Elevator"],
      facilities: ["24/7 Security", "Business Center", "Guest Parking"],
    },
  },
  {
    id: 4,
    image: propertyCommercial,
    title: "Retail Building",
    price: "$1,200,000",
    propertyCategory: "commercial",
    sqft: 8000,
    location: "Main Street",
    type: "sale" as const,
    features: {
      descriptions: ["Corner Unit", "High Ceilings"],
      amenities: ["Parking Space", "Storage Unit"],
      facilities: ["24/7 Security", "Guest Parking", "EV Charging"],
    },
  },
  {
    id: 5,
    image: propertyLand,
    title: "Residential Development Land",
    price: "$280,000",
    propertyCategory: "land",
    sqft: 12000,
    location: "City Outskirts",
    type: "sale" as const,
    features: {
      descriptions: ["Move-in Ready"],
      amenities: [],
      facilities: [],
    },
  },
  {
    id: 6,
    image: propertyLand,
    title: "Commercial Plot",
    price: "$550,000",
    propertyCategory: "land",
    sqft: 20000,
    location: "Highway Access",
    type: "sale" as const,
    features: {
      descriptions: [],
      amenities: [],
      facilities: [],
    },
  },
];

const Sales = () => {
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
    const property = properties.find((p) => p.id === propertyId);
    navigate("/checkout", { state: { type: "sale", property } });
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase());

    const price = parseInt(property.price.replace(/[^0-9]/g, ""));
    
    // Price range filter
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    if (price < min || price > max) return false;
    
    // Property type filter
    if (propertyType !== "all" && property.propertyCategory !== propertyType) return false;
    
    // Bedroom filter (only for residential properties)
    if (property.propertyCategory === "residential" && property.beds) {
      if (bedroomFilter === "1" && property.beds !== 1) return false;
      if (bedroomFilter === "2" && property.beds !== 2) return false;
      if (bedroomFilter === "3+" && property.beds < 3) return false;
    }
    
    // Location filter
    if (selectedCity !== "all" && !property.location.toLowerCase().includes(selectedCity.toLowerCase())) {
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Properties for Sale</h1>
            <p className="text-muted-foreground text-lg mb-6">
              Invest in your future with our premium selection of properties, from homes to commercial real estate.
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
                <label className="text-sm font-medium">Price Range</label>
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
              Showing {filteredProperties.length} of {properties.length} properties
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                onSelect={() => handleSelectProperty(property.id)}
              />
            ))}
          </div>

          {filteredProperties.length === 0 && (
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

export default Sales;
