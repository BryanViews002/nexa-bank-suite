import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, TrendingUp, TrendingDown, Activity, DollarSign, CreditCard, Search, User } from 'lucide-react';
import { AccountCardSkeleton, TransactionSkeleton, QuickActionSkeleton } from '@/components/ui/loading-skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { TransactionFilters, FilterState } from '@/components/dashboard/transaction-filters';
import { BalanceChart } from '@/components/charts/balance-chart';
import { AccountManagement } from '@/components/dashboard/account-management';

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

interface User {
  userId: number;
  username: string;
  fullName: string;
}

interface UserSession {
  username: string;
  fullName: string;
}

const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  
  // User search for transfers
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  
  // Transaction forms
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toIdentifier: '', // Changed from toAccountId to toIdentifier (username)
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
    fetchUserSession();
  }, []);

  // Fetch current user session for welcome message
  const fetchUserSession = async () => {
    try {
      const response = await fetch('http://localhost:8080/user/profile', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUserSession(userData);
      }
    } catch (error) {
      console.log('Could not fetch user session');
    }
  };

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

      // Fetch transactions (aggregate for overview)
      const transactionsResponse = await fetch('http://localhost:8080/transactions', {
        credentials: 'include',
      });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
      }
    } catch (error) {
      setError('Failed to load dashboard data. Contact Nexa support.');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on filter state
  const applyFilters = (filters: FilterState) => {
    let filtered = [...transactions];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(transaction =>
        transaction.transactionId.toString().includes(filters.search) ||
        transaction.accountId.toString().includes(filters.search)
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filters.type);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate;
      });
    }

    // Amount range filter
    if (filters.amountMin) {
      filtered = filtered.filter(transaction => transaction.amount >= parseFloat(filters.amountMin));
    }
    if (filters.amountMax) {
      filtered = filtered.filter(transaction => transaction.amount <= parseFloat(filters.amountMax));
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'account':
          aValue = a.accountId;
          bValue = b.accountId;
          break;
        default: // date
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTransactions(filtered);
  };

  // Search users by username tag
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/users/search?query=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const users = await response.json();
        setUserSearchResults(users);
        setShowUserDropdown(true);
      } else {
        setUserSearchResults([]);
        setShowUserDropdown(false);
      }
    } catch (error) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
    }
  };

  // Handle user search input change
  const handleUserSearchChange = (value: string) => {
    setUserSearchQuery(value);
    setTransferForm(prev => ({ ...prev, toIdentifier: value }));
    searchUsers(value);
  };

  // Handle user selection from dropdown
  const handleUserSelect = (user: User) => {
    setSelectedRecipient(user);
    setUserSearchQuery(user.username);
    setTransferForm(prev => ({ ...prev, toIdentifier: user.username }));
    setShowUserDropdown(false);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.fromAccountId || !transferForm.toIdentifier || !transferForm.amount) {
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
          toIdentifier: transferForm.toIdentifier,
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
        // Reset form and states
        setTransferForm({ fromAccountId: '', toIdentifier: '', amount: '' });
        setUserSearchQuery('');
        setSelectedRecipient(null);
        setShowUserDropdown(false);
        fetchDashboardData();
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
        fetchDashboardData();
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
        fetchDashboardData();
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

  // Generate mock chart data for balance trend
  const generateChartData = () => {
    if (accounts.length === 0) return [];
    
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const variation = (Math.random() - 0.5) * totalBalance * 0.1;
      const balance = totalBalance + variation;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: Math.max(0, balance),
        change: i === 0 ? 0 : variation
      });
    }
    
    return data;
  };

  // Calculate dashboard statistics
  const getTotalBalance = () => accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const getMonthlyTransactions = () => {
    const currentMonth = new Date().getMonth();
    return transactions.filter(t => new Date(t.date).getMonth() === currentMonth).length;
  };
  const getMonthlySpending = () => {
    const currentMonth = new Date().getMonth();
    return transactions
      .filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'Withdraw')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-primary mb-2">Nexa Dashboard</h1>
            <p className="text-muted-foreground">Loading your banking information...</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <AccountCardSkeleton />
            <div className="space-y-6">
              <QuickActionSkeleton />
              <div className="grid grid-cols-2 gap-4">
                <QuickActionSkeleton />
                <QuickActionSkeleton />
              </div>
            </div>
          </div>
          
          <TransactionSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-background to-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2 animate-fade-in">
                Welcome back{userSession?.fullName ? `, ${userSession.fullName}` : ''}! 👋
              </h1>
              <p className="text-muted-foreground">Your complete financial dashboard</p>
            </div>
            <Button
              onClick={fetchDashboardData}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="nexa-error bg-error/10 border border-error/20 rounded-lg p-4 mb-6 animate-fade-in">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-error/80 hover:text-error"
            >
              ×
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                      <p className="text-2xl font-bold text-primary">
                        <AnimatedNumber value={getTotalBalance()} prefix="$" />
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary/60" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-success">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
                      <p className="text-2xl font-bold text-success">{accounts.length}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-success/60" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-secondary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold text-secondary-foreground">{getMonthlyTransactions()}</p>
                      <p className="text-xs text-muted-foreground">Transactions</p>
                    </div>
                    <Activity className="h-8 w-8 text-secondary-foreground/60" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-error">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monthly Spending</p>
                      <p className="text-2xl font-bold text-error">
                        <AnimatedNumber value={getMonthlySpending()} prefix="$" />
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-error/60" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Balance Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BalanceChart data={generateChartData()} />
              
              {/* Quick Account Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {accounts.slice(0, 3).map((account) => (
                      <div key={account.accountId} className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                        <div>
                          <p className="font-medium">{account.accountType}</p>
                          <p className="text-sm text-muted-foreground">#{account.accountId}</p>
                        </div>
                        <p className="font-bold text-success">
                          <AnimatedNumber value={account.balance} prefix="$" />
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <AccountManagement 
              accounts={accounts} 
              onAccountsUpdate={fetchDashboardData} 
            />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TransactionFilters
                  onFiltersChange={applyFilters}
                  transactionCount={transactions.length}
                  filteredCount={filteredTransactions.length}
                />
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.transactionId} className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                      <div>
                        <p className="font-medium">{transaction.type}</p>
                        <p className="text-sm text-muted-foreground">Account #{transaction.accountId}</p>
                        <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleString()}</p>
                      </div>
                      <p className={`font-bold ${transaction.type === 'Deposit' ? 'text-success' : 'text-error'}`}>
                        <AnimatedNumber value={transaction.amount} prefix="$" />
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Actions Tab */}
          <TabsContent value="quick-actions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Transfer Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Transfer Money to Another User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTransfer} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Add From Account dropdown */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">From Account</label>
                        <Select 
                          value={transferForm.fromAccountId} 
                          onValueChange={(value) => setTransferForm(prev => ({ ...prev, fromAccountId: value }))}
                        >
                          <SelectTrigger className="border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-900" aria-label="Select source account">
                            <SelectValue placeholder="Select account to transfer from" />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            {accounts.map((account) => (
                              <SelectItem key={account.accountId} value={account.accountId.toString()}>
                                {account.accountType} - ${account.balance.toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Add User search with autocomplete */}
                      <div className="space-y-2 relative">
                        <label className="text-sm font-medium text-muted-foreground">Recipient Username</label>
                        <div className="relative">
                          <Input
                            type="text"
                            value={userSearchQuery}
                            onChange={(e) => handleUserSearchChange(e.target.value)}
                            className="border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-900 pr-10"
                            placeholder="Enter username (e.g., @johndoe)"
                            aria-label="Search for recipient by username"
                            aria-describedby="user-search-help"
                          />
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <p id="user-search-help" className="text-xs text-muted-foreground">
                          Type a username to search for users
                        </p>
                        
                        {/* User search dropdown */}
                        {showUserDropdown && userSearchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                            {userSearchResults.map((user) => (
                              <button
                                key={user.userId}
                                type="button"
                                onClick={() => handleUserSelect(user)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 border-b last:border-b-0"
                              >
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="font-medium text-sm">{user.username}</p>
                                  <p className="text-xs text-muted-foreground">{user.fullName}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Show selected recipient */}
                        {selectedRecipient && (
                          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-800">
                              Sending to: {selectedRecipient.fullName} ({selectedRecipient.username})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amount input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Amount</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={transferForm.amount}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-900"
                        placeholder="Enter amount to transfer"
                        aria-label="Transfer amount"
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={actionLoading || !transferForm.fromAccountId || !transferForm.toIdentifier || !transferForm.amount} 
                      className="w-full bg-blue-900 text-white hover:bg-blue-700"
                    >
                      {actionLoading ? 'Processing Transfer...' : 'Transfer Money'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Deposit & Withdraw Forms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-2">

                <Card>
                  <CardHeader>
                    <CardTitle>Deposit</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                      <Button type="submit" disabled={actionLoading} className="w-full">
                        Deposit
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Withdraw</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                      <Button type="submit" disabled={actionLoading} variant="destructive" className="w-full">
                        Withdraw
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;