import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import FlexiBot from "@/components/FlexiBot";
import Index from "./pages/Index";
import Rentals from "./pages/Rentals";
import Sales from "./pages/Sales";
import FlexiAssist from "./pages/FlexiAssist";
import ListProperty from "./pages/ListProperty";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Refer from "./pages/Refer";
import Career from "./pages/Career";
import Marketplace from "./pages/Marketplace";
import VendorRegistration from "./pages/VendorRegistration";
import ServiceProviderRegistration from "./pages/ServiceProviderRegistration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CurrencyProvider>
      <WishlistProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/rentals" element={<Rentals />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/flexi-assist" element={<FlexiAssist />} />
              <Route path="/list-property" element={<ListProperty />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/refer" element={<Refer />} />
              <Route path="/career" element={<Career />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/vendor-registration" element={<VendorRegistration />} />
              <Route path="/service-provider-registration" element={<ServiceProviderRegistration />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FlexiBot />
          </BrowserRouter>
        </TooltipProvider>
      </WishlistProvider>
    </CurrencyProvider>
  </QueryClientProvider>
);

export default App;
