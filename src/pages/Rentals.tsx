import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
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

  const handleSelectProperty = (propertyId: number) => {
    setSelectedProperty(propertyId);
    const property = rentals.find((p) => p.id === propertyId);
    navigate("/checkout", { state: { type: "rental", property } });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Properties for Rent</h1>
            <p className="text-muted-foreground text-lg">
              Find your perfect rental home from our curated selection of properties.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rentals.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                onSelect={() => handleSelectProperty(property.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Rentals;
