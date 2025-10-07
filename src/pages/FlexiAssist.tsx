import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { Input } from "@/components/ui/input";
import { Car, Baby, Paintbrush, Hammer, Wrench, Heart, Droplet, Search } from "lucide-react";

const services = [
  {
    id: 1,
    icon: <Car className="h-6 w-6" />,
    title: "Driver",
    description: "Professional drivers for your daily commute or special occasions.",
    rate: "$25/hour",
  },
  {
    id: 2,
    icon: <Baby className="h-6 w-6" />,
    title: "Nanny",
    description: "Experienced childcare professionals to look after your little ones.",
    rate: "$20/hour",
  },
  {
    id: 3,
    icon: <Paintbrush className="h-6 w-6" />,
    title: "Painter",
    description: "Expert painters for interior and exterior painting projects.",
    rate: "$30/hour",
  },
  {
    id: 4,
    icon: <Hammer className="h-6 w-6" />,
    title: "Carpenter",
    description: "Skilled carpenters for furniture, repairs, and custom woodwork.",
    rate: "$35/hour",
  },
  {
    id: 5,
    icon: <Wrench className="h-6 w-6" />,
    title: "Mechanic",
    description: "Mobile mechanics for vehicle repairs and maintenance.",
    rate: "$40/hour",
  },
  {
    id: 6,
    icon: <Heart className="h-6 w-6" />,
    title: "Caregiver",
    description: "Compassionate caregivers for elderly or special needs care.",
    rate: "$22/hour",
  },
  {
    id: 7,
    icon: <Droplet className="h-6 w-6" />,
    title: "Car Washer",
    description: "Professional car washing and detailing services at your location.",
    rate: "$18/hour",
  },
];

const FlexiAssist = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectService = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      // Pass only serializable data without the icon
      const { icon, ...serializableService } = service;
      navigate("/checkout", { state: { type: "service", service: serializableService } });
    }
  };

  const filteredServices = services.filter((service) =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Flexi-Assist Services</h1>
            <p className="text-muted-foreground text-lg mb-6">
              Professional assistance services on-demand. Book vetted professionals for any task.
            </p>
            
            <div className="max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  {...service}
                  onSelect={() => handleSelectService(service.id)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">No services found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FlexiAssist;
