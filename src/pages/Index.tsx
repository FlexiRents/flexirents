import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Building2, Home, Users, CheckCircle, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-property.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/rentals?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Modern luxury property"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-2xl text-primary-foreground">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect Space with FlexiRents
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Discover premium properties for rent or sale, plus personalized assistance services tailored to your needs.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-8 max-w-2xl">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by location, property type, or features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg bg-background/95 backdrop-blur-sm border-2 border-primary-foreground/20 focus:border-primary-foreground/40"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="h-14 px-8 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/rentals">
                  Browse Rentals <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="bg-background/10 backdrop-blur-sm border-primary-foreground text-primary-foreground hover:bg-background/20">
                <Link to="/flexi-assist">Flexi-Assist Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose FlexiRents?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We offer comprehensive property solutions and personalized services all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-lg shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Property Rentals</h3>
              <p className="text-muted-foreground mb-4">
                From cozy 1-bedrooms to spacious family apartments. Find your ideal rental property.
              </p>
              <Link to="/rentals" className="text-accent font-semibold hover:underline inline-flex items-center">
                Explore Rentals <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-card p-8 rounded-lg shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4">
                <Home className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Properties for Sale</h3>
              <p className="text-muted-foreground mb-4">
                Invest in homes, commercial properties, or land. Build your real estate portfolio.
              </p>
              <Link to="/sales" className="text-accent font-semibold hover:underline inline-flex items-center">
                View Properties <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-card p-8 rounded-lg shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Flexi-Assist Services</h3>
              <p className="text-muted-foreground mb-4">
                Personal assistance from drivers to caregivers. Get help when you need it.
              </p>
              <Link to="/flexi-assist" className="text-accent font-semibold hover:underline inline-flex items-center">
                Book Services <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">15,000+</div>
              <p className="text-foreground font-semibold text-lg">Happy Customers</p>
            </div>
            <div className="text-center bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">98.5%</div>
              <p className="text-foreground font-semibold text-lg">Satisfaction Rate</p>
            </div>
            <div className="text-center bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">2,500+</div>
              <p className="text-foreground font-semibold text-lg">Partner Property Owners</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Success Stories</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See what our satisfied customers have to say about their FlexiRents experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all border border-border/50">
              <div className="flex items-center gap-1 mb-6 text-accent">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">
                "Finding my dream apartment was so easy with FlexiRents. The flexible payment plan made it affordable, and the team was incredibly supportive throughout."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-accent text-lg">
                  SA
                </div>
                <div>
                  <p className="font-semibold text-foreground">Sarah Anderson</p>
                  <p className="text-sm text-muted-foreground">Apartment Renter</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all border border-border/50">
              <div className="flex items-center gap-1 mb-6 text-accent">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">
                "Purchased my first commercial property through FlexiRents. The process was transparent, and their guidance helped me make the right investment decision."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-accent text-lg">
                  MO
                </div>
                <div>
                  <p className="font-semibold text-foreground">Michael Okonkwo</p>
                  <p className="text-sm text-muted-foreground">Property Investor</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all border border-border/50">
              <div className="flex items-center gap-1 mb-6 text-accent">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">
                "The Flexi-Assist service is a lifesaver! Having a reliable driver and caregiver on demand has made managing my busy schedule so much easier."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-accent text-lg">
                  EA
                </div>
                <div>
                  <p className="font-semibold text-foreground">Emeka Afolabi</p>
                  <p className="text-sm text-muted-foreground">Flexi-Assist Client</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Trust & Transparency</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Verified Properties</h4>
                  <p className="text-muted-foreground text-sm">
                    All properties undergo thorough verification before listing.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Transparent Pricing</h4>
                  <p className="text-muted-foreground text-sm">
                    Clear pricing with no hidden fees. What you see is what you pay.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Vetted Service Providers</h4>
                  <p className="text-muted-foreground text-sm">
                    All Flexi-Assist professionals are background-checked and rated.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">24/7 Support</h4>
                  <p className="text-muted-foreground text-sm">
                    Our team is always available to assist with your needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--gradient-hero)]">
        <div className="container mx-auto px-4 text-center text-primary-foreground">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Whether you're looking for a property or need assistance services, FlexiRents has you covered.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/rentals">Find Properties</Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="bg-background/10 backdrop-blur-sm border-primary-foreground text-primary-foreground hover:bg-background/20">
              <Link to="/list-property">List Your Property</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
