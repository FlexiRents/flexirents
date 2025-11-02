import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Plus, Minus, CreditCard, Smartphone } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const Checkout = () => {
  const location = useLocation();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { type, property, service } = location.state || {};

  const [duration, setDuration] = useState(12);
  const [hours, setHours] = useState(8);
  const [paymentPlan, setPaymentPlan] = useState<"full" | "flexible">("flexible");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile">("card");
  const [mobileProvider, setMobileProvider] = useState("");
  const [calculations, setCalculations] = useState({
    baseAmount: 0,
    commission: 0,
    total: 0,
    securityDeposit: 0,
  });

  useEffect(() => {
    if (type === "rental" && property) {
      const monthlyPrice = parseFloat(property.price.replace(/[^0-9.-]+/g, ""));
      const baseRent = monthlyPrice * duration;
      
      if (paymentPlan === "full") {
        // Full payment: Pay all months upfront with 10% commission
        const commission = baseRent * 0.10;
        const total = baseRent + commission;
        
        setCalculations({
          baseAmount: baseRent,
          commission,
          total,
          securityDeposit: 0,
        });
      } else {
        // Flexible payment: Pay 1 month deposit + 12% commission
        const deposit = monthlyPrice * 1;
        const commission = baseRent * 0.12;
        const total = deposit + commission;
        
        setCalculations({
          baseAmount: baseRent,
          commission,
          total,
          securityDeposit: deposit,
        });
      }
    } else if (type === "sale" && property) {
      const salePrice = parseFloat(property.price.replace(/[^0-9.-]+/g, ""));
      const commission = salePrice * 0.10;
      const total = salePrice + commission;

      setCalculations({
        baseAmount: salePrice,
        commission,
        total,
        securityDeposit: 0,
      });
    } else if (type === "service" && service) {
      const hourlyRate = parseFloat(service.rate.replace(/[^0-9.-]+/g, ""));
      const baseAmount = hourlyRate * hours;
      const commission = baseAmount * 0.10;
      const total = baseAmount + commission;

      setCalculations({
        baseAmount,
        commission,
        total,
        securityDeposit: 0,
      });
    }
  }, [type, property, service, duration, hours, paymentPlan]);

  const handleDurationChange = (increment: boolean) => {
    setDuration((prev) => {
      const newValue = increment ? prev + 1 : prev - 1;
      return Math.max(0, Math.min(24, newValue));
    });
  };

  const handleHoursChange = (increment: boolean) => {
    setHours((prev) => {
      const newValue = increment ? prev + 1 : prev - 1;
      return Math.max(0, Math.min(24, newValue));
    });
  };

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
              {type === "rental" 
                ? "Complete your payment and secure your rent"
                : type === "sale"
                ? "Complete your payment and secure your sale"
                : "Complete your booking and secure your service"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {type === "rental" ? "Rent Summary" : type === "sale" ? "Sale Summary" : "Service Summary"}
                </CardTitle>
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
                      <Label>Rental Duration (Months)</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleDurationChange(false)}
                          disabled={duration <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-2xl font-bold">{duration}</span>
                          <span className="text-muted-foreground ml-1">months</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleDurationChange(true)}
                          disabled={duration >= 24}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Payment Plan</Label>
                      <RadioGroup value={paymentPlan} onValueChange={(value: "full" | "flexible") => setPaymentPlan(value)}>
                        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                          <RadioGroupItem value="flexible" id="flexible" />
                          <Label htmlFor="flexible" className="cursor-pointer flex-1">
                            <div className="font-semibold">Flexible Payment (12% commission)</div>
                            <div className="text-xs text-muted-foreground">Pay 1 month deposit now, remaining months paid monthly</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                          <RadioGroupItem value="full" id="full" />
                          <Label htmlFor="full" className="cursor-pointer flex-1">
                            <div className="font-semibold">Full Payment (10% commission)</div>
                            <div className="text-xs text-muted-foreground">Pay all {duration} months upfront and save 2%</div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Rent</span>
                        <span className="font-semibold">
                          {duration > 0 ? formatPrice(calculations.baseAmount / duration) : formatPrice(0)}
                        </span>
                      </div>
                      {paymentPlan === "full" ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Full Rent ({duration} months)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.baseAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission (10% of base rent)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.commission)}
                            </span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Total (Pay Once)</span>
                            <span className="text-accent">
                              {formatPrice(calculations.total)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Base Rent ({duration} months)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.baseAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Security Deposit (1 month)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.securityDeposit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission (12% of base rent)</span>
                            <span className="font-semibold">
                              {formatPrice(calculations.commission)}
                            </span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Total (Initial Pay)</span>
                            <span className="text-accent">
                              {formatPrice(calculations.total)}
                            </span>
                          </div>
                        </>
                      )}
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
                          {formatPrice(calculations.baseAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission (10%)</span>
                        <span className="font-semibold">
                          {formatPrice(calculations.commission)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total Amount</span>
                        <span className="text-accent">
                          {formatPrice(calculations.total)}
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
                      <Label>Service Duration (Hours)</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleHoursChange(false)}
                          disabled={hours <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-2xl font-bold">{hours}</span>
                          <span className="text-muted-foreground ml-1">hours</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleHoursChange(true)}
                          disabled={hours >= 24}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Service Cost ({hours} hours)
                        </span>
                        <span className="font-semibold">
                          {formatPrice(calculations.baseAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission (10%)</span>
                        <span className="font-semibold">
                          {formatPrice(calculations.commission)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total Amount</span>
                        <span className="text-accent">
                          {formatPrice(calculations.total)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-secondary/30 p-3 rounded-lg flex items-start gap-2 text-sm">
                  <Calculator className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    {type === "rental" 
                      ? paymentPlan === "full"
                        ? "Full payment: Pay all months upfront with 10% commission and save 2% on commission fees."
                        : "Flexible payment: Pay 1 month security deposit upfront plus 12% commission on total base rent. Remaining months paid monthly."
                      : "All prices include a 10% commission for FlexiRents platform services and support."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Choose your payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-6">
                  {/* Payment Method Selection */}
                  <div className="space-y-3">
                    <Label>Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(value: "card" | "mobile") => setPaymentMethod(value)}>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5 text-accent" />
                          <div>
                            <div className="font-semibold">Card Payment</div>
                            <div className="text-xs text-muted-foreground">Pay with credit or debit card</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                        <RadioGroupItem value="mobile" id="mobile" />
                        <Label htmlFor="mobile" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5 text-accent" />
                          <div>
                            <div className="font-semibold">Mobile Money</div>
                            <div className="text-xs text-muted-foreground">Pay with Vodafone or MTN</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Card Payment Form */}
                  {paymentMethod === "card" && (
                    <div className="space-y-4 animate-in fade-in-50 duration-300">
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
                    </div>
                  )}

                  {/* Mobile Money Form */}
                  {paymentMethod === "mobile" && (
                    <div className="space-y-4 animate-in fade-in-50 duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="provider">Mobile Money Provider</Label>
                        <Select value={mobileProvider} onValueChange={setMobileProvider} required>
                          <SelectTrigger id="provider">
                            <SelectValue placeholder="Select your provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                            <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Mobile Money Number</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="024 123 4567"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name</Label>
                        <Input
                          id="accountName"
                          placeholder="John Doe"
                          required
                        />
                      </div>

                      <div className="bg-secondary/30 p-3 rounded-lg text-sm text-muted-foreground">
                        <p>You will receive a prompt on your phone to approve the payment.</p>
                      </div>
                    </div>
                  )}

                  <Button type="submit" variant="hero" size="lg" className="w-full mt-6">
                    Complete Payment - {formatPrice(calculations.total)}
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
