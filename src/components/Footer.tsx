import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-0">
      <div className="container mx-auto px-4 pt-5 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <img src={logo} alt="FlexiRents" className="h-8 mb-4 brightness-0 invert" />
            <ul className="space-y-2 text-sm opacity-80">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@flexirents.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>123 Main St, City</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link to="/list-property" className="hover:text-accent transition-colors">
                  List Property
                </Link>
              </li>
              <li>
                <Link to="/refer" className="hover:text-accent transition-colors">
                  Refer To Earn
                </Link>
              </li>
              <li>
                <Link to="/career" className="hover:text-accent transition-colors">
                  Career
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>Property Management</li>
              <li>
                <Link to="/flexi-assist" className="hover:text-accent transition-colors">
                  Flexi-Assist
                </Link>
              </li>
              <li>
                <Link to="/rentals" className="hover:text-accent transition-colors">
                  Properties for Rentals
                </Link>
              </li>
              <li>
                <Link to="/sales" className="hover:text-accent transition-colors">
                  Properties for Sale
                </Link>
              </li>
              <li>24/7 Support</li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>Help Center</li>
              <li>FAQs</li>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-80">
          <p>&copy; {new Date().getFullYear()} FlexiRents. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
