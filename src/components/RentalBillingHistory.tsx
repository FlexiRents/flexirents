import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RentalPayment {
  id: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  status: string;
  verification_status: string;
  payment_method: string | null;
  transaction_reference: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  payment_link: string | null;
  installment_number: number;
  is_first_payment: boolean;
}

export default function RentalBillingHistory() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingPayments, setUpcomingPayments] = useState<RentalPayment[]>([]);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("rental_payments")
        .select("*")
        .eq("tenant_id", user.id)
        .order("installment_number", { ascending: false });

      if (error) throw error;

      const allPayments = data || [];
      setPayments(allPayments);

      // Filter upcoming payments (pending status only)
      const upcoming = allPayments.filter((payment) => payment.status === "pending");
      setUpcomingPayments(upcoming);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (paymentId: string, paymentLink: string | null) => {
    if (!paymentLink) {
      toast.error("Payment link not yet available");
      return;
    }
    window.open(paymentLink, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "Paid", variant: "default" as const, icon: CheckCircle2, color: "text-green-600" },
      pending: { label: "Pending", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      overdue: { label: "Overdue", variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
      cancelled: { label: "Cancelled", variant: "outline" as const, icon: XCircle, color: "text-gray-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const getVerificationBadge = (status: string) => {
    const statusConfig = {
      verified: { label: "Verified", variant: "default" as const, color: "bg-green-500" },
      unverified: { label: "Unverified", variant: "secondary" as const, color: "bg-gray-500" },
      pending: { label: "Pending", variant: "outline" as const, color: "bg-yellow-500" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unverified;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <div className={`h-2 w-2 rounded-full ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const handleDownloadReceipt = async (payment: RentalPayment) => {
    if (!payment.receipt_url) {
      toast.error("No receipt available for this payment");
      return;
    }

    try {
      // For now, just open the receipt URL
      window.open(payment.receipt_url, "_blank");
      toast.success("Receipt downloaded");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    }
  };

  if (loading) {
    return (
      <Card className="max-w-5xl">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading payment history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(
                  payments
                    .filter((p) => p.status === "paid")
                    .reduce((sum, p) => sum + p.amount, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatPrice(
                  payments
                    .filter((p) => p.status === "pending")
                    .reduce((sum, p) => sum + p.amount, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {formatPrice(
                  payments
                    .filter((p) => p.status === "overdue")
                    .reduce((sum, p) => sum + p.amount, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Verified</p>
              <p className="text-2xl font-bold">
                {payments.filter((p) => p.verification_status === "verified").length}
                <span className="text-sm text-muted-foreground">
                  /{payments.length}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Table with Integrated Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View all your rental payment transactions and download receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No payment history available.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Installment</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment, index) => {
                    const pendingPayments = payments.filter(p => p.status === 'pending');
                    const isNextPending = payment.status === 'pending' && 
                      pendingPayments.findIndex(p => p.id === payment.id) === 0;
                    const canPay = isNextPending && payment.payment_link;
                    const isLocked = payment.status === 'pending' && !isNextPending;
                    
                    return (
                      <TableRow 
                        key={payment.id}
                        className={isNextPending ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {payment.is_first_payment 
                                ? "First (6-12mo)" 
                                : `#${payment.installment_number}`}
                            </span>
                            {isNextPending && (
                              <Badge variant="default" className="bg-blue-600 text-xs">
                                Next Due
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {format(new Date(payment.due_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(payment.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{getVerificationBadge(payment.verification_status)}</TableCell>
                        <TableCell>
                          {payment.payment_date
                            ? format(new Date(payment.payment_date), "MMM dd, yyyy")
                            : <span className="text-muted-foreground">Pending</span>}
                        </TableCell>
                        <TableCell>
                          {payment.status === 'paid' && payment.receipt_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadReceipt(payment)}
                              className="h-8"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Receipt
                            </Button>
                          ) : payment.status === 'pending' ? (
                            <Button
                              size="sm"
                              disabled={!canPay}
                              onClick={() => handlePayment(payment.id, payment.payment_link)}
                              className={canPay ? "bg-blue-600 hover:bg-blue-700 h-8" : "h-8"}
                            >
                              {isLocked ? (
                                <>🔒 Locked</>
                              ) : canPay ? (
                                "Pay Now"
                              ) : (
                                "Unavailable"
                              )}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
