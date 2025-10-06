import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calculator } from "lucide-react";

const Checkout = () => {
  const location = useLocation();
  const { toast } = useToast();
  const { type, property, service } = location.state || {};

  const [duration, setDuration] = useState("12");
  const [hours, setHours] = useState("1");
  const [calculations, setCalculations] = useState({
    baseAmount: 0,
    commission: 0,
    total: 0,
  });

  useEffect(() => {
    if (type === "rental" && property) {
      const monthlyPrice = parseFloat(property.price.replace(/[^0-9.-]+/g, ""));
      const months = parseInt(duration);
      const baseAmount = monthlyPrice * months;
      const commission = baseAmount * 0.10;
      const total = baseAmount + commission;

      setCalculations({
        baseAmount,
        commission,
        total,
      });
    } else if (type === "sale" && property) {
      const salePrice = parseFloat(property.price.replace(/[^0-9.-]+/g, ""));
      const commission = salePrice * 0.10;
      const total = salePrice + commission;

      setCalculations({
        baseAmount: salePrice,
        commission,
        total,
      });
    } else if (type === "service" && service) {
      const hourlyRate = parseFloat(service.rate.replace(/[^0-9.-]+/g, ""));
      const totalHours = parseFloat(hours);
      const baseAmount = hourlyRate * totalHours;
      const commission = baseAmount * 0.10;
      const total = baseAmount + commission;

      setCalculations({
        baseAmount,
        commission,
        total,
      });
    }
  }, [type, property, service, duration, hours]);

  const handlePayment = () => {
    toast({
      title: "Payment Successful!",
      description: "Your booking has been confirmed. We'll contact you shortly.",
    });
  };

  if (!type) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <h1 className="text-3xl font-bold">Please select a property or service first</h1>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Checkout</h1>
            <p className="text-muted-foreground text-lg">
              Complete your booking and secure your selection
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your selection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {type === "rental" && property && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">{property.title}</h3>
                      <p className="text-muted-foreground text-sm">{property.location}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration">Rental Duration</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12 Months</SelectItem>
                          <SelectItem value="18">18 Months</SelectItem>
                          <SelectItem value="24">24 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Rent ({duration} months)</span>
                        <span className="font-semibold">
                          ${calculations.baseAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission (10%)</span>
                        <span className="font-semibold">
                          ${calculations.commission.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total Amount</span>
                        <span className="text-accent">
                          ${calculations.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {type === "sale" && property && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">{property.title}</h3>
                      <p className="text-muted-foreground text-sm">{property.location}</p>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Property Price</span>
                        <span className="font-semibold">
                          ${calculations.baseAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission (10%)</span>
                        <span className="font-semibold">
                          ${calculations.commission.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total Amount</span>
                        <span className="text-accent">
                          ${calculations.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {type === "service" && service && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">{service.title}</h3>
                      <p className="text-muted-foreground text-sm">{service.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hours">Number of Hours</Label>
                      <Input
                        id="hours"
                        type="number"
                        min="1"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                      />
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Service Cost ({hours} hours)
                        </span>
                        <span className="font-semibold">
                          ${calculations.baseAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission (10%)</span>
                        <span className="font-semibold">
                          ${calculations.commission.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total Amount</span>
                        <span className="text-accent">
                          ${calculations.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-secondary/30 p-3 rounded-lg flex items-start gap-2 text-sm">
                  <Calculator className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    All prices include a 10% commission for FlexiRents platform services and support.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Enter your payment information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input id="cardName" placeholder="John Doe" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input id="expiry" placeholder="MM/YY" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingAddress">Billing Address</Label>
                    <Input
                      id="billingAddress"
                      placeholder="123 Main St, City, State, ZIP"
                      required
                    />
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full mt-6">
                    Complete Payment - ${calculations.total.toLocaleString()}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By completing this payment, you agree to our terms of service and privacy policy.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
