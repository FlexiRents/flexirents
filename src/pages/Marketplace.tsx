import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VendorCard from "@/components/VendorCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Monitor, Hammer, Sofa, Wrench, Lightbulb, Paintbrush, ShowerHead, Package, Filter } from "lucide-react";

interface Vendor {
  id: number;
  name: string;
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  location: string;
  icon: React.ReactNode;
}

const vendors: Vendor[] = [
  {
    id: 1,
    name: "TechHub Ghana",
    category: "Electronics & Appliances",
    description: "Premium electronics dealer offering latest TVs, smartphones, laptops, and home appliances with warranty.",
    rating: 4.8,
    reviewCount: 234,
    verified: true,
    location: "Accra",
    icon: <Monitor className="h-6 w-6" />
  },
  {
    id: 2,
    name: "Digital World",
    category: "Electronics & Appliances",
    description: "Authorized dealer for Samsung, LG, HP, and Dell products. Best prices in Ghana.",
    rating: 4.6,
    reviewCount: 189,
    verified: true,
    location: "Kumasi",
    icon: <Monitor className="h-6 w-6" />
  },
  {
    id: 3,
    name: "BuildRight Supplies",
    category: "Construction Materials",
    description: "Quality cement, roofing sheets, tiles, and all construction materials at wholesale prices.",
    rating: 4.9,
    reviewCount: 312,
    verified: true,
    location: "Tema",
    icon: <Hammer className="h-6 w-6" />
  },
  {
    id: 4,
    name: "Steel & Stone Co.",
    category: "Construction Materials",
    description: "Supplier of steel bars, blocks, cement, sand, and aggregates for construction projects.",
    rating: 4.7,
    reviewCount: 276,
    verified: true,
    location: "Accra",
    icon: <Hammer className="h-6 w-6" />
  },
  {
    id: 5,
    name: "Home Comfort Furniture",
    category: "Furniture & Home Decor",
    description: "Modern and classic furniture for living rooms, bedrooms, offices, and outdoor spaces.",
    rating: 4.5,
    reviewCount: 167,
    verified: true,
    location: "Accra",
    icon: <Sofa className="h-6 w-6" />
  },
  {
    id: 6,
    name: "Decor Haven",
    category: "Furniture & Home Decor",
    description: "Custom furniture, curtains, wall art, and home decor accessories to beautify your space.",
    rating: 4.8,
    reviewCount: 198,
    verified: true,
    location: "Kumasi",
    icon: <Sofa className="h-6 w-6" />
  },
  {
    id: 7,
    name: "ToolMaster Ghana",
    category: "Tools & Equipment",
    description: "Professional and DIY tools, power tools, hand tools, and equipment rental services.",
    rating: 4.7,
    reviewCount: 145,
    verified: true,
    location: "Takoradi",
    icon: <Wrench className="h-6 w-6" />
  },
  {
    id: 8,
    name: "ProTools Supply",
    category: "Tools & Equipment",
    description: "Industrial tools, safety equipment, and machinery for construction and manufacturing.",
    rating: 4.6,
    reviewCount: 123,
    verified: true,
    location: "Tema",
    icon: <Wrench className="h-6 w-6" />
  },
  {
    id: 9,
    name: "Bright Lights Ghana",
    category: "Lighting & Electrical",
    description: "LED lights, chandeliers, electrical fittings, and smart home lighting solutions.",
    rating: 4.8,
    reviewCount: 201,
    verified: true,
    location: "Accra",
    icon: <Lightbulb className="h-6 w-6" />
  },
  {
    id: 10,
    name: "PowerLine Electrical",
    category: "Lighting & Electrical",
    description: "Electrical cables, switches, sockets, circuit breakers, and installation services.",
    rating: 4.7,
    reviewCount: 178,
    verified: true,
    location: "Kumasi",
    icon: <Lightbulb className="h-6 w-6" />
  },
  {
    id: 11,
    name: "Paint Pro Ghana",
    category: "Paints & Finishes",
    description: "Premium paints, coatings, wallpapers, and painting accessories from top brands.",
    rating: 4.6,
    reviewCount: 156,
    verified: true,
    location: "Accra",
    icon: <Paintbrush className="h-6 w-6" />
  },
  {
    id: 12,
    name: "ColorCraft Paints",
    category: "Paints & Finishes",
    description: "Interior and exterior paints, wood finishes, and professional painting services.",
    rating: 4.5,
    reviewCount: 134,
    verified: true,
    location: "Takoradi",
    icon: <Paintbrush className="h-6 w-6" />
  },
  {
    id: 13,
    name: "Plumb Perfect",
    category: "Plumbing & Sanitary",
    description: "Pipes, fittings, water heaters, toilets, sinks, and complete plumbing solutions.",
    rating: 4.8,
    reviewCount: 189,
    verified: true,
    location: "Tema",
    icon: <ShowerHead className="h-6 w-6" />
  },
  {
    id: 14,
    name: "Water Works Ghana",
    category: "Plumbing & Sanitary",
    description: "Quality plumbing materials, bathroom fixtures, and kitchen fittings.",
    rating: 4.7,
    reviewCount: 167,
    verified: true,
    location: "Kumasi",
    icon: <ShowerHead className="h-6 w-6" />
  },
  {
    id: 15,
    name: "PackMasters Ghana",
    category: "Packaging & Supplies",
    description: "Cartons, bubble wrap, packing tape, and all moving and storage supplies.",
    rating: 4.5,
    reviewCount: 112,
    verified: true,
    location: "Accra",
    icon: <Package className="h-6 w-6" />
  },
  {
    id: 16,
    name: "Swift Supplies",
    category: "Packaging & Supplies",
    description: "Office supplies, packaging materials, and business stationery.",
    rating: 4.6,
    reviewCount: 98,
    verified: true,
    location: "Kumasi",
    icon: <Package className="h-6 w-6" />
  }
];

const categories = [
  "All Categories",
  "Electronics & Appliances",
  "Construction Materials",
  "Furniture & Home Decor",
  "Tools & Equipment",
  "Lighting & Electrical",
  "Paints & Finishes",
  "Plumbing & Sanitary",
  "Packaging & Supplies"
];

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "All Categories" || vendor.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleExploreVendor = (vendorId: number) => {
    console.log("Exploring vendor:", vendorId);
    // Navigate to vendor detail page or open contact dialog
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Marketplace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Discover verified vendors for all your property and home needs
          </p>
          <Button 
            onClick={() => navigate("/vendor-registration")}
            size="lg"
            className="mb-4"
          >
            Become a Vendor
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search vendors by name, category, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="p-6 border border-border rounded-lg bg-card">
              <h3 className="font-semibold text-foreground mb-4">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredVendors.length}</span> verified vendors
            {selectedCategory !== "All Categories" && (
              <span> in <span className="font-semibold text-foreground">{selectedCategory}</span></span>
            )}
          </p>
        </div>

        {/* Vendor Grid */}
        {filteredVendors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="group hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 border border-border/50 hover:border-primary/30 bg-card rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
                    {vendor.icon}
                  </div>
                  {vendor.verified && (
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                      Verified
                    </Badge>
                  )}
                </div>
                
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  {vendor.name}
                </h3>
                
                <p className="text-sm text-primary mb-3">{vendor.category}</p>
                
                <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                  {vendor.description}
                </p>
                
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium text-foreground">{vendor.rating}</span>
                    <span className="text-muted-foreground">({vendor.reviewCount})</span>
                  </div>
                  <span className="text-muted-foreground">{vendor.location}</span>
                </div>
                
                <Button 
                  onClick={() => handleExploreVendor(vendor.id)} 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  variant="outline"
                >
                  Contact Vendor
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              No vendors found matching your criteria
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Categories");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;