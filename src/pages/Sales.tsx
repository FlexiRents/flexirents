import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import property3br from "@/assets/property-3br.jpg";
import propertyCommercial from "@/assets/property-commercial.jpg";
import propertyLand from "@/assets/property-land.jpg";

const properties = [
  {
    id: 1,
    image: property3br,
    title: "Luxury Family Home",
    price: "$450,000",
    beds: 4,
    baths: 3,
    sqft: 2800,
    location: "Suburban Heights",
    type: "sale" as const,
  },
  {
    id: 2,
    image: property3br,
    title: "Modern Townhouse",
    price: "$320,000",
    beds: 3,
    baths: 2.5,
    sqft: 1900,
    location: "Downtown Area",
    type: "sale" as const,
  },
  {
    id: 3,
    image: propertyCommercial,
    title: "Commercial Office Space",
    price: "$850,000",
    sqft: 5000,
    location: "Business District",
    type: "sale" as const,
  },
  {
    id: 4,
    image: propertyCommercial,
    title: "Retail Building",
    price: "$1,200,000",
    sqft: 8000,
    location: "Main Street",
    type: "sale" as const,
  },
  {
    id: 5,
    image: propertyLand,
    title: "Residential Development Land",
    price: "$280,000",
    sqft: 12000,
    location: "City Outskirts",
    type: "sale" as const,
  },
  {
    id: 6,
    image: propertyLand,
    title: "Commercial Plot",
    price: "$550,000",
    sqft: 20000,
    location: "Highway Access",
    type: "sale" as const,
  },
];

const Sales = () => {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);

  const handleSelectProperty = (propertyId: number) => {
    setSelectedProperty(propertyId);
    const property = properties.find((p) => p.id === propertyId);
    navigate("/checkout", { state: { type: "sale", property } });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Properties for Sale</h1>
            <p className="text-muted-foreground text-lg">
              Invest in your future with our premium selection of properties, from homes to commercial real estate.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
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

export default Sales;
