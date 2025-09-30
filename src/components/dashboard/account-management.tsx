import { useState } from "react";
import {
  Plus,
  Edit3,
  CreditCard,
  PiggyBank,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useToast } from "@/hooks/use-toast";

interface Account {
  accountId: number;
  userId: number;
  balance: number;
  accountType: string;
  nickname?: string;
}

interface Transaction {
  transactionId: number;
  accountId: number;
  amount: number;
  type: string;
  date: string;
}

interface AccountManagementProps {
  accounts: Account[];
  onAccountsUpdate: () => void;
}

export function AccountManagement({
  accounts,
  onAccountsUpdate,
}: AccountManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountNicknames, setAccountNicknames] = useState<
    Record<number, string>
  >(() => {
    const saved = localStorage.getItem("nexa-account-nicknames");
    return saved ? JSON.parse(saved) : {};
  });
  const [loading, setLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null
  );
  const [miniStatement, setMiniStatement] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const [newAccountType, setNewAccountType] = useState("");

  const accountTypeIcons = {
    Checking: <CreditCard className="h-4 w-4" />,
    Savings: <PiggyBank className="h-4 w-4" />,
  };

  const saveNickname = (accountId: number, nickname: string) => {
    const updated = { ...accountNicknames, [accountId]: nickname };
    setAccountNicknames(updated);
    localStorage.setItem("nexa-account-nicknames", JSON.stringify(updated));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountType) {
      toast({
        title: "Error",
        description: "Please select an account type",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8080/accounts/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ type: newAccountType }),
      });

      const data = await response.json();

      if (response.ok) {
        const isFirstAccount = accounts.length === 0;
        toast({
          title: "Account Created",
          description: isFirstAccount
            ? `${newAccountType} account created with $25 welcome bonus!`
            : `${newAccountType} account created successfully`,
          variant: "default",
        });
        setNewAccountType("");
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
      setError("Network error. Contact Nexa support.");
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

  const fetchMiniStatement = async (accountId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8080/accounts/${accountId}/mini-statement`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMiniStatement(data);
        setSelectedAccountId(
          accountId === selectedAccountId ? null : accountId
        );
      } else {
        setError("Failed to fetch mini-statement.");
      }
    } catch (error) {
      setError("Network error. Contact Nexa support.");
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Account Portfolio</CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-900 text-white hover:bg-blue-700">
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
                    <label className="text-sm font-medium mb-2 block text-gray-700">
                      Account Type
                    </label>
                    <Select
                      value={newAccountType}
                      onValueChange={setNewAccountType}
                    >
                      <SelectTrigger className="border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-900">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Checking">
                          Checking Account
                        </SelectItem>
                        <SelectItem value="Savings">Savings Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {accounts.length === 0 && (
                    <p className="text-sm text-green-500">
                      You'll receive a $25 welcome bonus for your first account!
                    </p>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-900 text-white hover:bg-blue-700"
                    >
                      {loading ? "Creating..." : "Create Account"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-4 rounded-lg">
              <p className="text-sm opacity-90">Total Balance</p>
              <p className="text-2xl font-bold">
                <AnimatedNumber value={getTotalBalance()} prefix="$" />
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-400 text-white p-4 rounded-lg">
              <p className="text-sm opacity-90">Active Accounts</p>
              <p className="text-2xl font-bold">{accounts.length}</p>
            </div>
            <div className="bg-gradient-to-r from-gray-600 to-gray-500 text-white p-4 rounded-lg">
              <p className="text-sm opacity-90">Account Types</p>
              <p className="text-2xl font-bold">
                {new Set(accounts.map((a) => a.accountType)).size}
              </p>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-lg">
              <p className="text-sm opacity-90">Avg Balance</p>
              <p className="text-2xl font-bold">
                $
                {accounts.length > 0
                  ? Math.round(
                      getTotalBalance() / accounts.length
                    ).toLocaleString()
                  : "0"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card
                key={account.accountId}
                className="border-2 hover:shadow-lg transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {
                        accountTypeIcons[
                          account.accountType as keyof typeof accountTypeIcons
                        ]
                      }
                      <div>
                        <h3 className="font-semibold text-sm text-blue-900">
                          {getAccountDisplayName(account)}
                        </h3>
                        <p className="text-xs text-gray-600">
                          #{account.accountId}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNickname(account)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="h-3 w-3 text-blue-900" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Balance</span>
                      <span className="font-bold text-green-500">
                        <AnimatedNumber value={account.balance} prefix="$" />
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs text-blue-900 border-blue-900"
                    >
                      {account.accountType}
                    </Badge>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => fetchMiniStatement(account.accountId)}
                      className="text-blue-900 p-0"
                    >
                      {selectedAccountId === account.accountId &&
                      miniStatement.length > 0 ? (
                        <ChevronUp className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 mr-1" />
                      )}
                      View Mini-Statement
                    </Button>
                    {selectedAccountId === account.accountId &&
                      miniStatement.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-blue-900">
                            Mini-Statement
                          </h4>
                          <div className="space-y-2 mt-2">
                            {miniStatement.map((transaction) => (
                              <div
                                key={transaction.transactionId}
                                className="flex justify-between text-sm"
                              >
                                <div>
                                  <p className="text-gray-700">
                                    {transaction.type}
                                  </p>
                                  <p className="text-gray-600">
                                    {new Date(
                                      transaction.date
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <p
                                  className={
                                    transaction.type === "Deposit"
                                      ? "text-green-500"
                                      : "text-red-500"
                                  }
                                >
                                  ${transaction.amount.toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account Nickname</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-700">
                Custom Nickname
              </label>
              <Input
                placeholder="e.g., Emergency Fund, Vacation Savings"
                defaultValue={
                  editingAccount
                    ? accountNicknames[editingAccount.accountId] || ""
                    : ""
                }
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSaveNickname((e.target as HTMLInputElement).value);
                  }
                }}
                id="nickname-input"
                className="border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-900"
              />
              <p className="text-xs text-gray-600 mt-1">
                Account: {editingAccount?.accountType} (#
                {editingAccount?.accountId})
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const input = document.getElementById(
                    "nickname-input"
                  ) as HTMLInputElement;
                  handleSaveNickname(input.value);
                }}
                className="flex-1 bg-blue-900 text-white hover:bg-blue-700"
              >
                Save Nickname
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-red-500 text-sm">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
