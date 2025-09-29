import { useState } from 'react';
import { Plus, Edit3, Trash2, CreditCard, Wallet, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useToast } from '@/hooks/use-toast';

interface Account {
  accountId: number;
  userId: number;
  balance: number;
  accountType: string;
  nickname?: string;
}

interface AccountManagementProps {
  accounts: Account[];
  onAccountsUpdate: () => void;
}

export function AccountManagement({ accounts, onAccountsUpdate }: AccountManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountNicknames, setAccountNicknames] = useState<Record<number, string>>(() => {
    // Load nicknames from localStorage
    const saved = localStorage.getItem('nexa-account-nicknames');
    return saved ? JSON.parse(saved) : {};
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // New account form
  const [newAccount, setNewAccount] = useState({
    accountType: '',
    initialDeposit: '',
  });

  const accountTypeIcons = {
    Checking: <CreditCard className="h-4 w-4" />,
    Savings: <PiggyBank className="h-4 w-4" />,
    Business: <Wallet className="h-4 w-4" />,
  };

  const saveNickname = (accountId: number, nickname: string) => {
    const updated = { ...accountNicknames, [accountId]: nickname };
    setAccountNicknames(updated);
    localStorage.setItem('nexa-account-nicknames', JSON.stringify(updated));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.accountType || !newAccount.initialDeposit) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/accounts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          accountType: newAccount.accountType,
          initialBalance: parseFloat(newAccount.initialDeposit),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Account Created",
          description: `${newAccount.accountType} account created successfully`,
          variant: "default",
        });
        setNewAccount({ accountType: '', initialDeposit: '' });
        setShowCreateDialog(false);
        onAccountsUpdate();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditNickname = (account: Account) => {
    setEditingAccount(account);
    setShowEditDialog(true);
  };

  const handleSaveNickname = (nickname: string) => {
    if (editingAccount) {
      saveNickname(editingAccount.accountId, nickname);
      toast({
        title: "Success",
        description: "Account nickname updated",
      });
      setShowEditDialog(false);
      setEditingAccount(null);
    }
  };

  const getAccountDisplayName = (account: Account) => {
    const nickname = accountNicknames[account.accountId];
    return nickname || account.accountType;
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  };

  return (
    <div className="space-y-6">
      {/* Account Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Account Portfolio</CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Account Type</label>
                    <Select value={newAccount.accountType} onValueChange={(value) => setNewAccount(prev => ({ ...prev, accountType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Checking">Checking Account</SelectItem>
                        <SelectItem value="Savings">Savings Account</SelectItem>
                        <SelectItem value="Business">Business Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Initial Deposit</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="25"
                      placeholder="Minimum $25"
                      value={newAccount.initialDeposit}
                      onChange={(e) => setNewAccount(prev => ({ ...prev, initialDeposit: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-lg">
              <p className="text-sm opacity-90">Total Balance</p>
              <p className="text-2xl font-bold">
                <AnimatedNumber value={getTotalBalance()} prefix="$" />
              </p>
            </div>
            <div className="bg-gradient-to-r from-success to-success/80 text-success-foreground p-4 rounded-lg">
              <p className="text-sm opacity-90">Active Accounts</p>
              <p className="text-2xl font-bold">{accounts.length}</p>
            </div>
            <div className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground p-4 rounded-lg">
              <p className="text-sm opacity-90">Account Types</p>
              <p className="text-2xl font-bold">{new Set(accounts.map(a => a.accountType)).size}</p>
            </div>
            <div className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground p-4 rounded-lg">
              <p className="text-sm opacity-90">Avg Balance</p>
              <p className="text-2xl font-bold">
                ${accounts.length > 0 ? Math.round(getTotalBalance() / accounts.length).toLocaleString() : '0'}
              </p>
            </div>
          </div>

          {/* Account Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card key={account.accountId} className="border-2 hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {accountTypeIcons[account.accountType as keyof typeof accountTypeIcons]}
                      <div>
                        <h3 className="font-semibold text-sm">{getAccountDisplayName(account)}</h3>
                        <p className="text-xs text-muted-foreground">#{account.accountId}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNickname(account)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Balance</span>
                      <span className="font-bold text-success">
                        <AnimatedNumber value={account.balance} prefix="$" />
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {account.accountType}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Nickname Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account Nickname</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Custom Nickname</label>
              <Input
                placeholder="e.g., Emergency Fund, Vacation Savings"
                defaultValue={editingAccount ? accountNicknames[editingAccount.accountId] || '' : ''}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveNickname((e.target as HTMLInputElement).value);
                  }
                }}
                id="nickname-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Account: {editingAccount?.accountType} (#{editingAccount?.accountId})
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const input = document.getElementById('nickname-input') as HTMLInputElement;
                  handleSaveNickname(input.value);
                }} 
                className="flex-1"
              >
                Save Nickname
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}