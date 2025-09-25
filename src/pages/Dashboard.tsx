import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Account {
  accountId: number;
  userId: number;
  balance: number;
  accountType: string;
}

interface Transaction {
  transactionId: number;
  accountId: number;
  amount: number;
  type: string;
  date: string;
}

const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Transaction forms
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
  });
  const [depositForm, setDepositForm] = useState({
    accountId: '',
    amount: '',
  });
  const [withdrawForm, setWithdrawForm] = useState({
    accountId: '',
    amount: '',
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch accounts
      const accountsResponse = await fetch('http://localhost:8080/accounts', {
        credentials: 'include',
      });

      if (!accountsResponse.ok) {
        if (accountsResponse.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please log in first.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch accounts');
      }

      const accountsData = await accountsResponse.json();
      setAccounts(accountsData);

      // Fetch transactions
      const transactionsResponse = await fetch('http://localhost:8080/transactions', {
        credentials: 'include',
      });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
      }
    } catch (error) {
      setError('Failed to load dashboard data. Contact Nexa support.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) {
      setError('Please fill all transfer fields');
      return;
    }
    
    setActionLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/transactions/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fromAccountId: parseInt(transferForm.fromAccountId),
          toAccountId: parseInt(transferForm.toAccountId),
          amount: parseFloat(transferForm.amount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Transfer Successful",
          description: data.message,
          variant: "default",
        });
        setTransferForm({ fromAccountId: '', toAccountId: '', amount: '' });
        fetchDashboardData(); // Refresh data
      } else {
        switch (response.status) {
          case 400:
            setError('Invalid transfer request. Please check your inputs.');
            break;
          case 403:
            setError('Insufficient balance for transfer.');
            break;
          default:
            setError(data.message || 'Transfer failed.');
        }
      }
    } catch (error) {
      setError('Network error. Contact Nexa support.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositForm.accountId || !depositForm.amount) {
      setError('Please fill all deposit fields');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/transactions/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          accountId: parseInt(depositForm.accountId),
          amount: parseFloat(depositForm.amount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Deposit Successful",
          description: data.message,
          variant: "default",
        });
        setDepositForm({ accountId: '', amount: '' });
        fetchDashboardData(); // Refresh data
      } else {
        setError(data.message || 'Deposit failed.');
      }
    } catch (error) {
      setError('Network error. Contact Nexa support.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawForm.accountId || !withdrawForm.amount) {
      setError('Please fill all withdrawal fields');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/transactions/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          accountId: parseInt(withdrawForm.accountId),
          amount: parseFloat(withdrawForm.amount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Withdrawal Successful",
          description: data.message,
          variant: "default",
        });
        setWithdrawForm({ accountId: '', amount: '' });
        fetchDashboardData(); // Refresh data
      } else {
        switch (response.status) {
          case 403:
            setError('Insufficient balance for withdrawal.');
            break;
          default:
            setError(data.message || 'Withdrawal failed.');
        }
      }
    } catch (error) {
      setError('Network error. Contact Nexa support.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="nexa-card text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-primary-foreground font-bold text-2xl">N</span>
          </div>
          <p className="text-muted-foreground">Loading your Nexa dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-primary mb-2">Nexa Dashboard</h1>
          <p className="text-muted-foreground">Manage your accounts and transactions</p>
        </div>

        {error && (
          <div className="nexa-error bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-error/80 hover:text-error"
            >
              ×
            </button>
          </div>
        )}

        {/* Accounts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="nexa-card animate-fade-in">
            <h2 className="text-xl font-semibold text-primary mb-4">Your Accounts</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Account ID</th>
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.accountId} className="border-b border-border/50">
                      <td className="py-3 font-mono text-sm">{account.accountId}</td>
                      <td className="py-3">{account.accountType}</td>
                      <td className="py-3 text-right font-semibold text-success">
                        ${account.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Transfer */}
            <div className="nexa-card animate-slide-in-right">
              <h3 className="text-lg font-semibold text-primary mb-4">Transfer Money</h3>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">From</label>
                    <select
                      value={transferForm.fromAccountId}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, fromAccountId: e.target.value }))}
                      className="nexa-input text-sm"
                      required
                    >
                      <option value="">Select account</option>
                      {accounts.map((account) => (
                        <option key={account.accountId} value={account.accountId}>
                          {account.accountType} (${account.balance})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">To</label>
                    <select
                      value={transferForm.toAccountId}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, toAccountId: e.target.value }))}
                      className="nexa-input text-sm"
                      required
                    >
                      <option value="">Select account</option>
                      {accounts.map((account) => (
                        <option key={account.accountId} value={account.accountId}>
                          {account.accountType} (${account.balance})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="nexa-input"
                    placeholder="0.00"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="nexa-btn-primary w-full text-sm py-2 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Transfer'}
                </button>
              </form>
            </div>

            {/* Deposit & Withdraw */}
            <div className="grid grid-cols-2 gap-4">
              {/* Deposit */}
              <div className="nexa-card">
                <h3 className="text-lg font-semibold text-primary mb-3">Deposit</h3>
                <form onSubmit={handleDeposit} className="space-y-3">
                  <select
                    value={depositForm.accountId}
                    onChange={(e) => setDepositForm(prev => ({ ...prev, accountId: e.target.value }))}
                    className="nexa-input text-sm"
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.accountId} value={account.accountId}>
                        {account.accountType}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="nexa-input text-sm"
                    placeholder="Amount"
                    required
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="nexa-btn-primary w-full text-sm py-2"
                  >
                    Deposit
                  </button>
                </form>
              </div>

              {/* Withdraw */}
              <div className="nexa-card">
                <h3 className="text-lg font-semibold text-primary mb-3">Withdraw</h3>
                <form onSubmit={handleWithdraw} className="space-y-3">
                  <select
                    value={withdrawForm.accountId}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountId: e.target.value }))}
                    className="nexa-input text-sm"
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.accountId} value={account.accountId}>
                        {account.accountType}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="nexa-input text-sm"
                    placeholder="Amount"
                    required
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="nexa-btn-primary w-full text-sm py-2"
                  >
                    Withdraw
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions History */}
        <div className="nexa-card animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary">Recent Transactions</h2>
            <button
              onClick={fetchDashboardData}
              className="nexa-btn-secondary text-sm py-2 px-4"
            >
              Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Account</th>
                  <th className="text-left py-3 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-right py-3 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-right py-3 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.transactionId} className="border-b border-border/50">
                      <td className="py-3 font-mono text-sm">{transaction.transactionId}</td>
                      <td className="py-3 font-mono text-sm">{transaction.accountId}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          transaction.type === 'Deposit' ? 'bg-success/10 text-success' :
                          transaction.type === 'Withdraw' ? 'bg-error/10 text-error' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-semibold ${
                        transaction.type === 'Deposit' ? 'text-success' :
                        transaction.type === 'Withdraw' ? 'text-error' :
                        'text-foreground'
                      }`}>
                        {transaction.type === 'Withdraw' ? '-' : '+'}${Math.abs(transaction.amount).toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;