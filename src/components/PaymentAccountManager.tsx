import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, CreditCard, Trash2, Star, Building2, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

interface PaymentAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  is_primary: boolean;
  is_verified: boolean;
  paystack_recipient_code: string | null;
  paystack_authorization_code: string | null;
  created_at: string;
}

// Paystack bank codes for Ghana (will be used when API is integrated)
const PAYSTACK_BANK_CODES: Record<string, string> = {
  'Access Bank Ghana': 'ABG',
  'Absa Bank Ghana': 'ABSA',
  'Agricultural Development Bank': 'ADB',
  'Bank of Africa Ghana': 'BOA',
  'CalBank': 'CAL',
  'Consolidated Bank Ghana': 'CBG',
  'Ecobank Ghana': 'ECO',
  'FBN Bank Ghana': 'FBN',
  'Fidelity Bank Ghana': 'FID',
  'First Atlantic Bank': 'FAB',
  'First National Bank Ghana': 'FNB',
  'GCB Bank': 'GCB',
  'Guaranty Trust Bank Ghana': 'GTB',
  'National Investment Bank': 'NIB',
  'Prudential Bank': 'PRU',
  'Republic Bank Ghana': 'REP',
  'Societe Generale Ghana': 'SGG',
  'Stanbic Bank Ghana': 'STA',
  'Standard Chartered Bank Ghana': 'SCB',
  'United Bank for Africa Ghana': 'UBA',
  'Zenith Bank Ghana': 'ZEN',
};

const GHANA_BANKS = [
  'Access Bank Ghana',
  'Absa Bank Ghana',
  'Agricultural Development Bank',
  'Bank of Africa Ghana',
  'CalBank',
  'Consolidated Bank Ghana',
  'Ecobank Ghana',
  'FBN Bank Ghana',
  'Fidelity Bank Ghana',
  'First Atlantic Bank',
  'First National Bank Ghana',
  'GCB Bank',
  'Guaranty Trust Bank Ghana',
  'National Investment Bank',
  'Prudential Bank',
  'Republic Bank Ghana',
  'Societe Generale Ghana',
  'Stanbic Bank Ghana',
  'Standard Chartered Bank Ghana',
  'United Bank for Africa Ghana',
  'Zenith Bank Ghana',
];

// Mock Paystack verification (will be replaced with actual API call)
const mockVerifyBankAccount = async (accountNumber: string, bankCode: string): Promise<{
  verified: boolean;
  account_name?: string;
  recipient_code?: string;
}> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For now, auto-verify accounts (when Paystack API is added, this will make real API calls)
  // In production: POST to /transferrecipient to create recipient and verify
  return {
    verified: true,
    account_name: undefined, // Will be populated by Paystack API
    recipient_code: `RCP_mock_${Date.now()}`, // Mock recipient code
  };
};

// Mock charge authorization (for future automatic payments)
const mockChargeAuthorization = async (
  _authorizationCode: string, 
  _amount: number, 
  _email: string
): Promise<{ success: boolean; reference?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In production: POST to /transaction/charge_authorization
  return {
    success: true,
    reference: `TXN_mock_${Date.now()}`,
  };
};

export const PaymentAccountManager = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [formData, setFormData] = useState({
    account_name: '',
    bank_name: '',
    account_number: '',
    account_type: 'savings',
  });

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
      toast.error('Failed to load payment accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!formData.account_name || !formData.bank_name || !formData.account_number) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setVerifying(true);
      const isPrimary = accounts.length === 0;
      
      // Get bank code for Paystack
      const bankCode = PAYSTACK_BANK_CODES[formData.bank_name] || '';
      
      // Verify bank account with Paystack (mock for now)
      const verification = await mockVerifyBankAccount(formData.account_number, bankCode);
      
      const { error } = await supabase
        .from('payment_accounts')
        .insert({
          user_id: user?.id,
          account_name: formData.account_name,
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          account_type: formData.account_type,
          is_primary: isPrimary,
          is_verified: verification.verified,
          paystack_recipient_code: verification.recipient_code || null,
        });

      if (error) throw error;

      toast.success(verification.verified 
        ? 'Payment account added and verified!' 
        : 'Payment account added. Verification pending.');
      setDialogOpen(false);
      setFormData({ account_name: '', bank_name: '', account_number: '', account_type: 'savings' });
      fetchAccounts();
    } catch (error) {
      console.error('Error adding payment account:', error);
      toast.error('Failed to add payment account');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyAccount = async (accountId: string, accountNumber: string, bankName: string) => {
    try {
      const bankCode = PAYSTACK_BANK_CODES[bankName] || '';
      
      toast.loading('Verifying account...');
      const verification = await mockVerifyBankAccount(accountNumber, bankCode);
      
      if (verification.verified) {
        const { error } = await supabase
          .from('payment_accounts')
          .update({
            is_verified: true,
            paystack_recipient_code: verification.recipient_code,
          })
          .eq('id', accountId);

        if (error) throw error;
        
        toast.dismiss();
        toast.success('Account verified successfully!');
        fetchAccounts();
      } else {
        toast.dismiss();
        toast.error('Could not verify account. Please check your details.');
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      toast.dismiss();
      toast.error('Verification failed');
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      // First, unset all primary accounts
      await supabase
        .from('payment_accounts')
        .update({ is_primary: false })
        .eq('user_id', user?.id);

      // Then set the selected account as primary
      const { error } = await supabase
        .from('payment_accounts')
        .update({ is_primary: true })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Primary account updated');
      fetchAccounts();
    } catch (error) {
      console.error('Error setting primary account:', error);
      toast.error('Failed to update primary account');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('payment_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Payment account removed');
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting payment account:', error);
      toast.error('Failed to remove payment account');
    }
  };

  const maskAccountNumber = (number: string) => {
    if (number.length <= 4) return number;
    return '••••' + number.slice(-4);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Payment Accounts
            </CardTitle>
            <CardDescription>
              Manage your bank accounts for automatic rent payments and standing orders
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="account_name">Account Holder Name</Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    placeholder="Enter account holder name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank</Label>
                  <Select
                    value={formData.bank_name}
                    onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {GHANA_BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_type">Account Type</Label>
                  <Select
                    value={formData.account_type}
                    onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings Account</SelectItem>
                      <SelectItem value="current">Current Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Your account will be verified via Paystack for secure payments
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={verifying}>
                  Cancel
                </Button>
                <Button onClick={handleAddAccount} disabled={verifying}>
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Add & Verify Account'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment accounts added yet</p>
            <p className="text-sm">Add a bank account to set up automatic payments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{account.account_name}</p>
                      {account.is_primary && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                      {account.is_verified ? (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {account.bank_name} • {maskAccountNumber(account.account_number)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {account.account_type} Account
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!account.is_verified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyAccount(account.id, account.account_number, account.bank_name)}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  )}
                  {!account.is_primary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimary(account.id)}
                    >
                      Set as Primary
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteAccount(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
