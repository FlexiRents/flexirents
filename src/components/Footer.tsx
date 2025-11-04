import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, MessageCircle, Twitter } from "lucide-react";
import logo from "@/assets/logo-footer.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-0">
      <div className="container mx-auto px-4 pt-5 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <img src={logo} alt="FlexiRents" className="h-8 mb-4" />
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
                <Link to="/about" className="hover:text-accent transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="hover:text-accent transition-colors">
                  FAQs
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
              <li>
                <Link to="/blog" className="hover:text-accent transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm opacity-80">
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
              <li>Property Management</li>
              <li>
                <Link to="/flexi-assist" className="hover:text-accent transition-colors">
                  Flexi-Assist Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                <MessageCircle className="h-6 w-6" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                <Youtube className="h-6 w-6" />
              </a>
            </div>
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
