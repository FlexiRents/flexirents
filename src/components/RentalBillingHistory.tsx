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
        .order("due_date", { ascending: false });

      if (error) throw error;

      const allPayments = data || [];
      setPayments(allPayments);

      // Filter upcoming payments (due within next 30 days and status pending)
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const upcoming = allPayments.filter((payment) => {
        const dueDate = new Date(payment.due_date);
        return (
          payment.status === "pending" &&
          dueDate >= today &&
          dueDate <= thirtyDaysFromNow
        );
      });

      setUpcomingPayments(upcoming);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
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
      {/* Payment Reminders */}
      {upcomingPayments.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upcoming Payments</AlertTitle>
          <AlertDescription>
            You have {upcomingPayments.length} payment{upcomingPayments.length > 1 ? "s" : ""} due within the next 30 days:
            <ul className="mt-2 space-y-1">
              {upcomingPayments.map((payment) => (
                <li key={payment.id} className="text-sm">
                  • {formatPrice(payment.amount)} due on {format(new Date(payment.due_date), "MMM dd, yyyy")}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment History Table */}
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
                    <TableHead>Due Date</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {format(new Date(payment.due_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {payment.payment_date
                          ? format(new Date(payment.payment_date), "MMM dd, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(payment.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>{getVerificationBadge(payment.verification_status)}</TableCell>
                      <TableCell className="capitalize">
                        {payment.payment_method || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {payment.transaction_reference || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReceipt(payment)}
                          disabled={!payment.receipt_url || payment.status !== "paid"}
                          className="h-8"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(
                    payments
                      .filter((p) => p.status === "paid")
                      .reduce((sum, p) => sum + Number(p.amount), 0)
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatPrice(
                    payments
                      .filter((p) => p.status === "pending")
                      .reduce((sum, p) => sum + Number(p.amount), 0)
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatPrice(
                    payments
                      .filter((p) => p.status === "overdue")
                      .reduce((sum, p) => sum + Number(p.amount), 0)
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Verified Payments</p>
                <p className="text-2xl font-bold">
                  {payments.filter((p) => p.verification_status === "verified").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
