import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Download, FileText, FileSpreadsheet, Filter, Loader2, Receipt, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PaymentRecord {
  id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: string;
  payment_method: string | null;
  transaction_reference: string | null;
  installment_number: number | null;
  notes: string | null;
  rental_leases?: {
    id: string;
    properties?: {
      title: string;
      location: string;
    };
  };
}

export const PaymentHistoryExport = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [dateRange, setDateRange] = useState<'all' | '3months' | '6months' | '12months'>('all');

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_payments')
        .select(`
          id,
          amount,
          due_date,
          payment_date,
          status,
          payment_method,
          transaction_reference,
          installment_number,
          notes,
          rental_leases (
            id,
            properties (
              title,
              location
            )
          )
        `)
        .eq('tenant_id', user?.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPayments = () => {
    let filtered = [...payments];

    // Apply status filter
    if (filter !== 'all') {
      if (filter === 'paid') {
        filtered = filtered.filter(p => p.status === 'paid' || p.status === 'verified');
      } else {
        filtered = filtered.filter(p => p.status === filter);
      }
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case '3months':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case '6months':
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case '12months':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(p => new Date(p.due_date) >= startDate);
    }

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateSummary = () => {
    const filtered = getFilteredPayments();
    const totalPaid = filtered
      .filter(p => p.status === 'paid' || p.status === 'verified')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPending = filtered
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalOverdue = filtered
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0);
    
    return { totalPaid, totalPending, totalOverdue, count: filtered.length };
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      const filtered = getFilteredPayments();
      
      const headers = [
        'Date Due',
        'Date Paid',
        'Amount (GH₵)',
        'Status',
        'Property',
        'Location',
        'Payment Method',
        'Reference',
        'Notes'
      ];

      const rows = filtered.map(payment => [
        format(new Date(payment.due_date), 'yyyy-MM-dd'),
        payment.payment_date ? format(new Date(payment.payment_date), 'yyyy-MM-dd') : '-',
        payment.amount.toFixed(2),
        payment.status,
        payment.rental_leases?.properties?.title || '-',
        payment.rental_leases?.properties?.location || '-',
        payment.payment_method || '-',
        payment.transaction_reference || '-',
        payment.notes || '-'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `payment-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();

      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    setExporting(true);
    try {
      const filtered = getFilteredPayments();
      const summary = calculateSummary();
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(41, 128, 185);
      doc.text('Payment History Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, 28, { align: 'center' });
      
      // Summary Section
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Summary', 14, 40);
      
      doc.setFontSize(10);
      doc.setTextColor(60);
      doc.text(`Total Payments: ${summary.count}`, 14, 48);
      doc.text(`Total Paid: GH₵ ${summary.totalPaid.toLocaleString()}`, 14, 54);
      doc.text(`Pending: GH₵ ${summary.totalPending.toLocaleString()}`, 80, 54);
      doc.text(`Overdue: GH₵ ${summary.totalOverdue.toLocaleString()}`, 140, 54);
      
      // Table
      const tableData = filtered.map(payment => [
        format(new Date(payment.due_date), 'MMM d, yyyy'),
        payment.payment_date ? format(new Date(payment.payment_date), 'MMM d, yyyy') : '-',
        `GH₵ ${payment.amount.toLocaleString()}`,
        payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
        payment.rental_leases?.properties?.title?.substring(0, 20) || '-',
        payment.transaction_reference?.substring(0, 15) || '-'
      ]);

      autoTable(doc, {
        startY: 62,
        head: [['Due Date', 'Paid Date', 'Amount', 'Status', 'Property', 'Reference']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 28 },
          2: { cellWidth: 30 },
          3: { cellWidth: 22 },
          4: { cellWidth: 45 },
          5: { cellWidth: 35 },
        },
        didParseCell: (data) => {
          if (data.column.index === 3 && data.section === 'body') {
            const status = data.cell.raw?.toString().toLowerCase();
            if (status === 'paid' || status === 'verified') {
              data.cell.styles.textColor = [39, 174, 96];
            } else if (status === 'overdue') {
              data.cell.styles.textColor = [231, 76, 60];
            } else if (status === 'pending') {
              data.cell.styles.textColor = [241, 196, 15];
            }
          }
        },
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('This is a computer-generated document. No signature required.', pageWidth / 2, finalY + 15, { align: 'center' });
      doc.text('FlexiRents - Your Trusted Rental Partner', pageWidth / 2, finalY + 20, { align: 'center' });

      doc.save(`payment-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const summary = calculateSummary();
  const filteredPayments = getFilteredPayments();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>
              View and export your rent payment records
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={exporting || filteredPayments.length === 0}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              CSV
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={exportToPDF}
              disabled={exporting || filteredPayments.length === 0}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Paid</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              GH₵ {summary.totalPaid.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              GH₵ {summary.totalPending.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Overdue</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              GH₵ {summary.totalOverdue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Payment Table */}
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment records found</p>
            <p className="text-sm">Your rent payments will appear here</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Property</TableHead>
                  <TableHead className="hidden lg:table-cell">Paid Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.slice(0, 10).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.due_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">
                      GH₵ {payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                      {payment.rental_leases?.properties?.title || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {payment.payment_date
                        ? format(new Date(payment.payment_date), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {payment.transaction_reference?.substring(0, 12) || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredPayments.length > 10 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing 10 of {filteredPayments.length} payments. Export to see all records.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
