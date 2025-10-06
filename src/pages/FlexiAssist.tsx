import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { Car, Baby, Paintbrush, Hammer, Wrench, Heart, Droplet } from "lucide-react";

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

  const handleSelectService = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    navigate("/checkout", { state: { type: "service", service } });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Flexi-Assist Services</h1>
            <p className="text-muted-foreground text-lg">
              Professional assistance services on-demand. Book vetted professionals for any task.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                {...service}
                onSelect={() => handleSelectService(service.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FlexiAssist;
