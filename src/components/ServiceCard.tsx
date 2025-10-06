import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  rate: string;
  onSelect?: () => void;
}

const ServiceCard = ({ icon, title, description, rate, onSelect }: ServiceCardProps) => {
  return (
    <Card className="hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 text-accent mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Clock className="h-4 w-4" />
          <span>{rate}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline" onClick={onSelect}>
          Book Service
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
