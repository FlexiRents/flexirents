import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
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
import Auth from "./pages/Auth";
import ServiceProviderProfile from "./pages/ServiceProviderProfile";
import ServiceProviderDashboard from "./pages/ServiceProviderDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import MyBookings from "./pages/MyBookings";
import ClientProfile from "./pages/ClientProfile";
import VendorProfile from "./pages/VendorProfile";
import PropertyDetails from "./pages/PropertyDetails";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import PropertiesManagement from "./pages/admin/PropertiesManagement";
import ServiceProvidersManagement from "./pages/admin/ServiceProvidersManagement";
import VendorsManagement from "./pages/admin/VendorsManagement";
import BookingsManagement from "./pages/admin/BookingsManagement";
import ReviewsManagement from "./pages/admin/ReviewsManagement";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import VerificationManagement from "./pages/admin/VerificationManagement";
import { ScrollToTop } from "./components/ScrollToTop";
import { ScrollProgressIndicator } from "./components/ScrollProgressIndicator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollProgressIndicator />
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/rentals" element={<Rentals />} />
                <Route path="/sales" element={<Sales />} />
          <Route path="/flexi-assist" element={<FlexiAssist />} />
          <Route path="/service-provider/:id" element={<ServiceProviderProfile />} />
                <Route path="/list-property" element={<ListProperty />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/refer" element={<Refer />} />
                <Route path="/career" element={<Career />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/vendor-registration" element={<VendorRegistration />} />
                <Route path="/service-provider-registration" element={<ServiceProviderRegistration />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/service-provider/:id" element={<ServiceProviderProfile />} />
                <Route path="/service-provider-dashboard" element={<ServiceProviderDashboard />} />
                <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/profile" element={<ClientProfile />} />
                <Route path="/vendor/:id" element={<VendorProfile />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="verification" element={<VerificationManagement />} />
                  <Route path="properties" element={<PropertiesManagement />} />
                  <Route path="service-providers" element={<ServiceProvidersManagement />} />
                  <Route path="vendors" element={<VendorsManagement />} />
                  <Route path="bookings" element={<BookingsManagement />} />
                  <Route path="reviews" element={<ReviewsManagement />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                </Route>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <FlexiBot />
            </BrowserRouter>
          </TooltipProvider>
        </WishlistProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
