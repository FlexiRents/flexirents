import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const propertyDescriptions = [
  "Newly Renovated",
  "Move-in Ready",
  "Pet Friendly",
  "Furnished",
  "Unfurnished",
  "Corner Unit",
  "High Ceilings",
  "Natural Light",
  "Open Floor Plan",
  "Hardwood Floors",
];

const propertyAmenities = [
  "Swimming Pool",
  "Gym/Fitness Center",
  "Parking Space",
  "Balcony/Terrace",
  "Air Conditioning",
  "Heating",
  "Laundry Room",
  "Storage Unit",
  "Garden/Yard",
  "Security System",
  "Elevator",
  "Wheelchair Accessible",
];

const propertyFacilities = [
  "24/7 Security",
  "Concierge Service",
  "Playground",
  "BBQ Area",
  "Community Center",
  "Business Center",
  "Guest Parking",
  "Bike Storage",
  "Pet Spa",
  "Rooftop Deck",
  "Package Room",
  "EV Charging",
];

interface PropertyFeaturesSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

const PropertyFeaturesSection = ({ formData, setFormData }: PropertyFeaturesSectionProps) => {
  const [openSections, setOpenSections] = useState({
    descriptions: false,
    amenities: false,
    facilities: false,
  });

  const handleFeatureToggle = (category: "descriptions" | "amenities" | "facilities", feature: string) => {
    const currentFeatures = formData.features[category];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f: string) => f !== feature)
      : [...currentFeatures, feature];
    
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [category]: newFeatures,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Descriptions */}
      <Collapsible
        open={openSections.descriptions}
        onOpenChange={(open) => setOpenSections({ ...openSections, descriptions: open })}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
          <span className="font-semibold">Property Descriptions</span>
          <ChevronDown className={`h-5 w-5 transition-transform ${openSections.descriptions ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 pl-4">
          <div className="grid grid-cols-2 gap-3">
            {propertyDescriptions.map((desc) => (
              <div key={desc} className="flex items-center space-x-2">
                <Checkbox
                  id={`desc-${desc}`}
                  checked={formData.features.descriptions.includes(desc)}
                  onCheckedChange={() => handleFeatureToggle("descriptions", desc)}
                />
                <label
                  htmlFor={`desc-${desc}`}
                  className="text-sm cursor-pointer select-none"
                >
                  {desc}
                </label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Amenities */}
      <Collapsible
        open={openSections.amenities}
        onOpenChange={(open) => setOpenSections({ ...openSections, amenities: open })}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
          <span className="font-semibold">Amenities</span>
          <ChevronDown className={`h-5 w-5 transition-transform ${openSections.amenities ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 pl-4">
          <div className="grid grid-cols-2 gap-3">
            {propertyAmenities.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity}`}
                  checked={formData.features.amenities.includes(amenity)}
                  onCheckedChange={() => handleFeatureToggle("amenities", amenity)}
                />
                <label
                  htmlFor={`amenity-${amenity}`}
                  className="text-sm cursor-pointer select-none"
                >
                  {amenity}
                </label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Facilities */}
      <Collapsible
        open={openSections.facilities}
        onOpenChange={(open) => setOpenSections({ ...openSections, facilities: open })}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
          <span className="font-semibold">Facilities</span>
          <ChevronDown className={`h-5 w-5 transition-transform ${openSections.facilities ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 pl-4">
          <div className="grid grid-cols-2 gap-3">
            {propertyFacilities.map((facility) => (
              <div key={facility} className="flex items-center space-x-2">
                <Checkbox
                  id={`facility-${facility}`}
                  checked={formData.features.facilities.includes(facility)}
                  onCheckedChange={() => handleFeatureToggle("facilities", facility)}
                />
                <label
                  htmlFor={`facility-${facility}`}
                  className="text-sm cursor-pointer select-none"
                >
                  {facility}
                </label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const ListProperty = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    propertyType: "",
    listingType: "",
    address: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    description: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    features: {
      descriptions: [] as string[],
      amenities: [] as string[],
      facilities: [] as string[],
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Property Submitted!",
      description: "Your property has been submitted for verification. We'll contact you within 24-48 hours.",
    });

    // Reset form
    setFormData({
      propertyType: "",
      listingType: "",
      address: "",
      price: "",
      bedrooms: "",
      bathrooms: "",
      sqft: "",
      description: "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      features: {
        descriptions: [],
        amenities: [],
        facilities: [],
      },
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">List Your Property</h1>
            <p className="text-muted-foreground text-lg">
              Submit your property for verification and listing approval. We'll review and get back to you within 24-48 hours.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
              <CardDescription>
                Please provide accurate details about your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Property Type */}
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, propertyType: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Listing Type */}
                <div className="space-y-2">
                  <Label htmlFor="listingType">Listing Type</Label>
                  <Select
                    value={formData.listingType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, listingType: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select listing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">For Rent</SelectItem>
                      <SelectItem value="sale">For Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Property Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Main Street, City"
                    required
                  />
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Price {formData.listingType === "rent" ? "(per month)" : ""}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="Enter price in dollars"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Bedrooms */}
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) =>
                        setFormData({ ...formData, bedrooms: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>

                  {/* Bathrooms */}
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={(e) =>
                        setFormData({ ...formData, bathrooms: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>

                  {/* Square Feet */}
                  <div className="space-y-2">
                    <Label htmlFor="sqft">Square Feet</Label>
                    <Input
                      id="sqft"
                      type="number"
                      value={formData.sqft}
                      onChange={(e) =>
                        setFormData({ ...formData, sqft: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Property Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your property's features and amenities"
                    rows={4}
                    required
                  />
                </div>

                {/* Property Features */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Property Features</h3>
                  
                  <PropertyFeaturesSection
                    formData={formData}
                    setFormData={setFormData}
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Owner Contact Information</h3>
                  
                  {/* Owner Name */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="ownerName">Full Name</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) =>
                        setFormData({ ...formData, ownerName: e.target.value })
                      }
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  {/* Owner Email */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="ownerEmail">Email</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, ownerEmail: e.target.value })
                      }
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  {/* Owner Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone">Phone Number</Label>
                    <Input
                      id="ownerPhone"
                      type="tel"
                      value={formData.ownerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, ownerPhone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>

                <div className="bg-secondary/30 p-4 rounded-lg flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Verification Process</p>
                    <p className="text-muted-foreground">
                      Our team will verify your property details, ownership documentation, and conduct a physical inspection before approval. This typically takes 24-48 hours.
                    </p>
                  </div>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full">
                  Submit Property for Verification
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ListProperty;
