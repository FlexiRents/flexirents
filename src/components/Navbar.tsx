import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="FlexiRents" className="h-8" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/rentals" className="text-foreground hover:text-accent transition-colors">
              Rentals
            </Link>
            <Link to="/sales" className="text-foreground hover:text-accent transition-colors">
              For Sale
            </Link>
            <Link to="/flexi-assist" className="text-foreground hover:text-accent transition-colors">
              Flexi-Assist
            </Link>
            <Link to="/list-property" className="text-foreground hover:text-accent transition-colors">
              List Property
            </Link>
            <Button variant="hero" asChild>
              <Link to="/checkout">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                to="/rentals"
                className="text-foreground hover:text-accent transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Rentals
              </Link>
              <Link
                to="/sales"
                className="text-foreground hover:text-accent transition-colors"
                onClick={() => setIsOpen(false)}
              >
                For Sale
              </Link>
              <Link
                to="/flexi-assist"
                className="text-foreground hover:text-accent transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Flexi-Assist
              </Link>
              <Link
                to="/list-property"
                className="text-foreground hover:text-accent transition-colors"
                onClick={() => setIsOpen(false)}
              >
                List Property
              </Link>
              <Button variant="hero" asChild onClick={() => setIsOpen(false)}>
                <Link to="/checkout">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
