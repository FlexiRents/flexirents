import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Payment {
  id: string;
  lease_id: string;
  tenant_id: string;
  landlord_id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: string;
  verification_status: string;
  transaction_reference: string | null;
  payment_method: string | null;
  receipt_url: string | null;
  notes: string | null;
  installment_number: number | null;
  is_first_payment: boolean | null;
}

export default function PaymentApprovalManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("rental_payments")
        .select("*")
        .in("verification_status", ["unverified", "pending_review"])
        .order("payment_date", { ascending: false, nullsFirst: false })
        .order("due_date", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (payment: Payment) => {
    setSelectedPayment(payment);
    setAdminNotes("");
    setReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("rental_payments")
        .update({
          verification_status: "verified",
          status: "completed",
          notes: adminNotes || selectedPayment.notes,
        })
        .eq("id", selectedPayment.id);

      if (error) throw error;

      toast.success("Payment approved and verified");
      setReviewDialogOpen(false);
      fetchPendingPayments();
    } catch (error) {
      console.error("Error approving payment:", error);
      toast.error("Failed to approve payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("rental_payments")
        .update({
          verification_status: "rejected",
          status: "pending",
          notes: adminNotes || "Payment rejected by admin",
        })
        .eq("id", selectedPayment.id);

      if (error) throw error;

      toast.success("Payment rejected");
      setReviewDialogOpen(false);
      fetchPendingPayments();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("Failed to reject payment");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      completed: "default",
      overdue: "destructive",
      cancelled: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getVerificationBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      unverified: "secondary",
      pending_review: "outline",
      verified: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment Approval</h1>
        <p className="text-muted-foreground">Review and verify rental payments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payment Reviews ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments pending review
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction Ref</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.payment_date
                        ? format(new Date(payment.payment_date), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.due_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.transaction_reference || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>{getVerificationBadge(payment.verification_status)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleReview(payment)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Payment</DialogTitle>
            <DialogDescription>
              Review payment details and approve or reject
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-semibold">${selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Date:</span>
                  <p>
                    {selectedPayment.payment_date
                      ? format(new Date(selectedPayment.payment_date), "MMM dd, yyyy")
                      : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Due Date:</span>
                  <p>{format(new Date(selectedPayment.due_date), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Method:</span>
                  <p className="capitalize">{selectedPayment.payment_method || "-"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Transaction Reference:</span>
                  <p className="font-mono text-sm">{selectedPayment.transaction_reference || "-"}</p>
                </div>
                {selectedPayment.receipt_url && (
                  <div className="col-span-2">
                    <a
                      href={selectedPayment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Receipt
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add notes about this payment review..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing}
                >
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                >
                  Approve & Verify
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
