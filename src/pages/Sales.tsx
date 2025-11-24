import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Search, ChevronDown, ChevronUp } from "lucide-react";
import { ghanaRegions } from "@/data/ghanaLocations";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Sales = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [bedroomFilter, setBedroomFilter] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch properties for sale from database
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("listing_type", "sale")
          .eq("status", "available")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProperties(data || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load properties for sale",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [toast]);

  // Load search query from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const handleSelectProperty = (propertyId: string) => {
    navigate(`/property/${propertyId}?type=sale`);
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase());

    const priceNum = Number(property.price);
    
    // Price range filter
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    if (priceNum < min || priceNum > max) return false;
    
    // Property type filter
    if (propertyType !== "all" && property.property_type !== propertyType) return false;
    
    // Bedroom filter
    if (property.bedrooms) {
      if (bedroomFilter === "1" && property.bedrooms !== 1) return false;
      if (bedroomFilter === "2" && property.bedrooms !== 2) return false;
      if (bedroomFilter === "3+" && property.bedrooms < 3) return false;
    }
    
    // Region filter
    if (selectedRegion !== "all" && property.region !== selectedRegion) return false;
    
    // Location/City filter
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
          <div className="bg-card rounded-lg shadow-[var(--shadow-card)] mb-8">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full flex items-center justify-between p-6 hover:bg-accent/5 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold">Filter Properties</h2>
              </div>
              {filtersOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {filtersOpen && (
              <div className="px-6 pb-6 pt-2 border-t">
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
            )}
          </div>

          <div className="mb-4">
            <p className="text-muted-foreground">
              Showing {filteredProperties.length} of {properties.length} properties
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Loading properties...</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    id={property.id}
                    image={property.images?.[0] || ""}
                    title={property.title}
                    price={property.price}
                    beds={property.bedrooms}
                    baths={property.bathrooms}
                    sqft={property.sqft}
                    location={property.location}
                    type="sale"
                    features={property.features || { descriptions: [], amenities: [], facilities: [] }}
                    onSelect={() => handleSelectProperty(property.id)}
                  />
                ))}
              </div>

              {filteredProperties.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No properties match your filters. Try adjusting your criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Sales;
