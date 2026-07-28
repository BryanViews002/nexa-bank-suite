import { apiUrl, withCredentials } from "./api";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function newIdempotencyKey() {
  return crypto.randomUUID();
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(apiUrl(path), { ...withCredentials, ...init });
  if (res.ok) return res.json() as Promise<T>;
  let msg = res.statusText;
  let code: string | undefined;
  try {
    const d = await res.clone().json();
    if (d?.message) msg = d.message;
    if (typeof d?.code === "string") code = d.code;
  } catch { /* noop */ }
  throw new ApiError(res.status, msg, code);
}

const json = (method: string, body: unknown, extra?: HeadersInit): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json", ...extra },
  credentials: "include",
  body: JSON.stringify(body),
});

const idempKey = () => ({ "Idempotency-Key": newIdempotencyKey() });

// ── Types ──────────────────────────────────────────────────────────────────

export interface Card {
  id: string; cardNumber: string; status: string; cardType: string;
  spendLimit?: number; dailyLimit?: number;
}
export interface IssueCardRequest { accountId: string; cardType: string }
export interface ControlRequest { spendLimit?: number; dailyLimit?: number }
export interface PurchaseRequest { amount: number; merchant: string; currency?: string }

export interface Dispute {
  id: string; transactionId: string; reason: string; status: string; createdAt: string;
}
export interface CreateDisputeRequest { transactionId: string; reason: string; description?: string }

export interface ExternalTransfer {
  id: string; type: string; amount: number; currency: string; status: string; createdAt: string;
}
export interface PaymentRailRequest {
  accountId: string; amount: number; currency: string;
  externalAccount: string; routingNumber?: string; description?: string;
}

export interface PaymentRequest {
  id: string; fromUserId: string; toUserId: string; amount: number;
  currency: string; note?: string; status: string; createdAt: string;
}
export interface CreatePaymentRequestBody { toUserId: string; amount: number; currency?: string; note?: string }
export interface AcceptPaymentRequest { payerAccountId: string }

export interface Budget {
  id: string; category: string; amount: number; spent: number; month: string;
}
export interface BudgetUpsertRequest { category: string; amount: number; month: string }
export interface BudgetUpdateRequest { amount?: number }
export interface BudgetSummary { month: string; totalBudgeted: number; totalSpent: number; budgets: Budget[] }

export interface SupportTicket {
  id: string; subject: string; status: string; createdAt: string;
  messages?: TicketMessage[];
}
export interface TicketMessage { id: string; body: string; authorId: string; createdAt: string }
export interface CreateTicketRequest { subject: string; body: string; category?: string }
export interface MessageRequest { body: string }
export interface PagedResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number }

export interface Beneficiary {
  id: string; name: string; accountNumber: string; bankName?: string; routingNumber?: string;
}
export interface CreateBeneficiaryRequest { name: string; accountNumber: string; bankName?: string; routingNumber?: string }

export interface Notification {
  id: string; title: string; body: string; read: boolean; createdAt: string;
}

export interface ScheduledPayment {
  id: string; accountId: string; toAccountId: string; amount: number;
  frequency: string; nextRunDate: string; enabled: boolean;
}
export interface ScheduledPaymentRequest {
  accountId: string; toAccountId: string; amount: number; frequency: string; startDate: string;
}

export interface SavingsGoal {
  id: string; name: string; targetAmount: number; currentAmount: number;
  targetDate?: string; status: string;
}
export interface SavingsGoalRequest { name: string; targetAmount: number; targetDate?: string }
export interface ContributeRequest { amount: number; accountId: string }

export interface DashboardResponse {
  balances: { accountId: string; accountType: string; balance: number }[];
  recentTransactions: { id: string; amount: number; type: string; date: string; description?: string }[];
  summaries: { totalBalance: number; monthlyIn: number; monthlyOut: number };
}

export interface StatementRequest { from: string; to: string; format?: "json" | "pdf" }

export interface UserProfile {
  id: string; username: string; fullName: string; email: string;
  phone?: string; address?: string; kycStatus?: string;
}
export interface UpdateProfileRequest { fullName?: string; phone?: string; address?: string }

// ── Cards ──────────────────────────────────────────────────────────────────

export const cardsApi = {
  list: () => apiFetch<Card[]>("/api/v1/cards"),
  get: (id: string) => apiFetch<Card>(`/api/v1/cards/${id}`),
  issue: (body: IssueCardRequest) => apiFetch<Card>("/api/v1/cards", json("POST", body)),
  updateControls: (id: string, body: ControlRequest) =>
    apiFetch<Card>(`/api/v1/cards/${id}/controls`, json("PATCH", body)),
  freeze: (id: string) => apiFetch<Card>(`/api/v1/cards/${id}/freeze`, json("POST", {})),
  unfreeze: (id: string) => apiFetch<Card>(`/api/v1/cards/${id}/unfreeze`, json("POST", {})),
  purchase: (id: string, body: PurchaseRequest) =>
    apiFetch<unknown>(`/api/v1/cards/${id}/purchase`, json("POST", body, idempKey())),
  cancel: (id: string) => apiFetch<void>(`/api/v1/cards/${id}`, { method: "DELETE", credentials: "include" }),
};

// ── Disputes ───────────────────────────────────────────────────────────────

export const disputesApi = {
  list: () => apiFetch<Dispute[]>("/api/v1/disputes"),
  get: (id: string) => apiFetch<Dispute>(`/api/v1/disputes/${id}`),
  create: (body: CreateDisputeRequest) => apiFetch<Dispute>("/api/v1/disputes", json("POST", body)),
  withdraw: (id: string) => apiFetch<Dispute>(`/api/v1/disputes/${id}/withdraw`, json("POST", {})),
};

// ── Payment Rails ──────────────────────────────────────────────────────────

export const paymentRailsApi = {
  fund: (body: PaymentRailRequest) => apiFetch<ExternalTransfer>("/api/v1/payment-rails/funding", json("POST", body)),
  payout: (body: PaymentRailRequest) =>
    apiFetch<ExternalTransfer>("/api/v1/payment-rails/payouts", json("POST", body, idempKey())),
  listTransfers: () => apiFetch<ExternalTransfer[]>("/api/v1/payment-rails/transfers"),
  getTransfer: (id: string) => apiFetch<ExternalTransfer>(`/api/v1/payment-rails/transfers/${id}`),
};

// ── Payment Requests ───────────────────────────────────────────────────────

export const paymentRequestsApi = {
  list: () => apiFetch<PaymentRequest[]>("/api/v1/payment-requests"),
  incoming: () => apiFetch<PaymentRequest[]>("/api/v1/payment-requests/incoming"),
  outgoing: () => apiFetch<PaymentRequest[]>("/api/v1/payment-requests/outgoing"),
  create: (body: CreatePaymentRequestBody) =>
    apiFetch<PaymentRequest>("/api/v1/payment-requests", json("POST", body)),
  accept: (id: string, body: AcceptPaymentRequest) =>
    apiFetch<PaymentRequest>(`/api/v1/payment-requests/${id}/accept`, json("POST", body, idempKey())),
  decline: (id: string) =>
    apiFetch<PaymentRequest>(`/api/v1/payment-requests/${id}/decline`, json("POST", {})),
  cancel: (id: string) =>
    apiFetch<PaymentRequest>(`/api/v1/payment-requests/${id}/cancel`, json("POST", {})),
};

// ── Budgets ────────────────────────────────────────────────────────────────

export const budgetsApi = {
  list: () => apiFetch<Budget[]>("/api/v1/budgets"),
  summary: (month: string) => apiFetch<BudgetSummary>(`/api/v1/budgets/summary?month=${month}`),
  upsert: (body: BudgetUpsertRequest) => apiFetch<Budget>("/api/v1/budgets", json("POST", body)),
  update: (id: string, body: BudgetUpdateRequest) =>
    apiFetch<Budget>(`/api/v1/budgets/${id}`, json("PATCH", body)),
  delete: (id: string) => apiFetch<void>(`/api/v1/budgets/${id}`, { method: "DELETE", credentials: "include" }),
};

// ── Support Tickets ────────────────────────────────────────────────────────

export const supportApi = {
  list: (page = 0, size = 20) =>
    apiFetch<PagedResponse<SupportTicket>>(`/api/v1/support/tickets?page=${page}&size=${size}`),
  get: (id: string) => apiFetch<SupportTicket>(`/api/v1/support/tickets/${id}`),
  create: (body: CreateTicketRequest) =>
    apiFetch<SupportTicket>("/api/v1/support/tickets", json("POST", body)),
  reply: (id: string, body: MessageRequest) =>
    apiFetch<TicketMessage>(`/api/v1/support/tickets/${id}/messages`, json("POST", body)),
  close: (id: string) =>
    apiFetch<SupportTicket>(`/api/v1/support/tickets/${id}/close`, json("POST", {})),
};

// ── Beneficiaries ──────────────────────────────────────────────────────────

export const beneficiariesApi = {
  list: () => apiFetch<Beneficiary[]>("/api/v1/beneficiaries"),
  get: (id: string) => apiFetch<Beneficiary>(`/api/v1/beneficiaries/${id}`),
  create: (body: CreateBeneficiaryRequest) =>
    apiFetch<Beneficiary>("/api/v1/beneficiaries", json("POST", body)),
  update: (id: string, body: Partial<CreateBeneficiaryRequest>) =>
    apiFetch<Beneficiary>(`/api/v1/beneficiaries/${id}`, json("PUT", body)),
  delete: (id: string) =>
    apiFetch<void>(`/api/v1/beneficiaries/${id}`, { method: "DELETE", credentials: "include" }),
};

// ── Notifications ──────────────────────────────────────────────────────────

export const notificationsApi = {
  list: () => apiFetch<Notification[]>("/api/v1/notifications"),
  markRead: (id: string) =>
    apiFetch<Notification>(`/api/v1/notifications/${id}/read`, json("POST", {})),
  markAllRead: () => apiFetch<void>("/api/v1/notifications/read-all", json("POST", {})),
};

// ── Scheduled Payments ─────────────────────────────────────────────────────

export const scheduledPaymentsApi = {
  list: () => apiFetch<ScheduledPayment[]>("/api/v1/scheduled-payments"),
  get: (id: string) => apiFetch<ScheduledPayment>(`/api/v1/scheduled-payments/${id}`),
  create: (body: ScheduledPaymentRequest) =>
    apiFetch<ScheduledPayment>("/api/v1/scheduled-payments", json("POST", body)),
  update: (id: string, body: Partial<ScheduledPaymentRequest>) =>
    apiFetch<ScheduledPayment>(`/api/v1/scheduled-payments/${id}`, json("PATCH", body)),
  delete: (id: string) =>
    apiFetch<void>(`/api/v1/scheduled-payments/${id}`, { method: "DELETE", credentials: "include" }),
  enable: (id: string) =>
    apiFetch<ScheduledPayment>(`/api/v1/scheduled-payments/${id}/enable`, json("POST", {})),
  disable: (id: string) =>
    apiFetch<ScheduledPayment>(`/api/v1/scheduled-payments/${id}/disable`, json("POST", {})),
};

// ── Savings Goals ──────────────────────────────────────────────────────────

export const savingsGoalsApi = {
  list: () => apiFetch<SavingsGoal[]>("/api/v1/savings-goals"),
  get: (id: string) => apiFetch<SavingsGoal>(`/api/v1/savings-goals/${id}`),
  create: (body: SavingsGoalRequest) =>
    apiFetch<SavingsGoal>("/api/v1/savings-goals", json("POST", body)),
  update: (id: string, body: Partial<SavingsGoalRequest>) =>
    apiFetch<SavingsGoal>(`/api/v1/savings-goals/${id}`, json("PATCH", body)),
  delete: (id: string) =>
    apiFetch<void>(`/api/v1/savings-goals/${id}`, { method: "DELETE", credentials: "include" }),
  contribute: (id: string, body: ContributeRequest) =>
    apiFetch<SavingsGoal>(`/api/v1/savings-goals/${id}/contribute`, json("POST", body, idempKey())),
};

// ── Dashboard ──────────────────────────────────────────────────────────────

export const dashboardApi = {
  get: () => apiFetch<DashboardResponse>("/api/v1/dashboard"),
};

// ── Statements ─────────────────────────────────────────────────────────────

export const statementsApi = {
  export: (params: StatementRequest) => {
    const qs = new URLSearchParams({ from: params.from, to: params.to, format: params.format ?? "json" });
    return apiFetch<unknown>(`/api/v1/statements?${qs}`);
  },
};

// ── Profile ────────────────────────────────────────────────────────────────

export const profileApi = {
  get: () => apiFetch<UserProfile>("/api/v1/profile"),
  update: (body: UpdateProfileRequest) => apiFetch<UserProfile>("/api/v1/profile", json("PATCH", body)),
};
