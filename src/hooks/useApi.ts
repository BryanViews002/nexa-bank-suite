import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiError, apiFetch } from "@/lib/services";

export interface Account { accountId: string; accountType: string; balance: number }

export function useAccounts() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["accounts"], queryFn: () => apiFetch<Account[]>("/accounts"), meta: { onError } });
}
import {
  cardsApi, disputesApi, paymentRailsApi, paymentRequestsApi,
  budgetsApi, supportApi, beneficiariesApi, notificationsApi,
  scheduledPaymentsApi, savingsGoalsApi, dashboardApi, profileApi,
  IssueCardRequest, ControlRequest, PurchaseRequest,
  CreateDisputeRequest, PaymentRailRequest,
  CreatePaymentRequestBody, AcceptPaymentRequest,
  BudgetUpsertRequest, BudgetUpdateRequest,
  CreateTicketRequest, MessageRequest,
  CreateBeneficiaryRequest, ScheduledPaymentRequest,
  SavingsGoalRequest, ContributeRequest, UpdateProfileRequest,
} from "@/lib/services";

function useApiErrorHandler() {
  const navigate = useNavigate();
  return (err: unknown) => {
    if (!(err instanceof ApiError)) { toast.error("Unexpected error"); return; }
    if (err.status === 401) { navigate("/login"); return; }
    if (err.status === 403 && err.code === "KYC_REQUIRED") { navigate("/kyc"); return; }
    if (err.status === 403) { toast.error(err.message || "You don't have permission to do that."); return; }
    if (err.status === 423) { toast.error("Account locked. Please contact support."); return; }
    if (err.status === 409) { toast.error("Conflict: please refresh and try again."); return; }
    if (err.status === 404) { toast.error("Not found."); return; }
    toast.error(err.message || "Something went wrong.");
  };
}

// ── Cards ──────────────────────────────────────────────────────────────────

export function useCards() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["cards"], queryFn: cardsApi.list, throwOnError: false,
    meta: { onError } });
}

export function useCard(id: string) {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["cards", id], queryFn: () => cardsApi.get(id),
    enabled: !!id, meta: { onError } });
}

export function useIssueCard() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (body: IssueCardRequest) => cardsApi.issue(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cards"] }); toast.success("Card issued."); },
    onError });
}

export function useUpdateCardControls() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: ControlRequest }) =>
      cardsApi.updateControls(id, body),
    onSuccess: (_, { id }) => { qc.invalidateQueries({ queryKey: ["cards", id] }); toast.success("Controls updated."); },
    onError });
}

export function useFreezeCard() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => cardsApi.freeze(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }), onError });
}

export function useUnfreezeCard() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => cardsApi.unfreeze(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }), onError });
}

export function useCancelCard() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => cardsApi.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cards"] }); toast.success("Card cancelled."); },
    onError });
}

export function useSimulatePurchase() {
  const onError = useApiErrorHandler();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: PurchaseRequest }) =>
      cardsApi.purchase(id, body),
    onSuccess: () => toast.success("Purchase simulated."), onError });
}

// ── Disputes ───────────────────────────────────────────────────────────────

export function useDisputes() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["disputes"], queryFn: disputesApi.list, meta: { onError } });
}

export function useDispute(id: string) {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["disputes", id], queryFn: () => disputesApi.get(id),
    enabled: !!id, meta: { onError } });
}

export function useCreateDispute() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (body: CreateDisputeRequest) => disputesApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["disputes"] }); toast.success("Dispute filed."); },
    onError });
}

export function useWithdrawDispute() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => disputesApi.withdraw(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["disputes"] }); toast.success("Dispute withdrawn."); },
    onError });
}

// ── Payment Rails ──────────────────────────────────────────────────────────

export function useExternalTransfers() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["external-transfers"], queryFn: paymentRailsApi.listTransfers,
    meta: { onError } });
}

export function useFundAccount() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (body: PaymentRailRequest) => paymentRailsApi.fund(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["external-transfers"] }); toast.success("Account funded."); },
    onError });
}

export function usePayout() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (body: PaymentRailRequest) => paymentRailsApi.payout(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["external-transfers"] }); toast.success("Payout initiated."); },
    onError });
}

// ── Payment Requests ───────────────────────────────────────────────────────

export function usePaymentRequests() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["payment-requests"], queryFn: paymentRequestsApi.list, meta: { onError } });
}

export function useIncomingPaymentRequests() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["payment-requests", "incoming"], queryFn: paymentRequestsApi.incoming,
    meta: { onError } });
}

export function useOutgoingPaymentRequests() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["payment-requests", "outgoing"], queryFn: paymentRequestsApi.outgoing,
    meta: { onError } });
}

export function useCreatePaymentRequest() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (body: CreatePaymentRequestBody) => paymentRequestsApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payment-requests"] }); toast.success("Payment request sent."); },
    onError });
}

export function useAcceptPaymentRequest() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: AcceptPaymentRequest }) =>
      paymentRequestsApi.accept(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payment-requests"] }); toast.success("Payment sent."); },
    onError });
}

export function useDeclinePaymentRequest() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => paymentRequestsApi.decline(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-requests"] }), onError });
}

export function useCancelPaymentRequest() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => paymentRequestsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-requests"] }), onError });
}

// ── Budgets ────────────────────────────────────────────────────────────────

export function useBudgets() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["budgets"], queryFn: budgetsApi.list, meta: { onError } });
}

export function useBudgetSummary(month: string) {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["budgets", "summary", month], queryFn: () => budgetsApi.summary(month),
    enabled: !!month, meta: { onError } });
}

export function useUpsertBudget() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (body: BudgetUpsertRequest) => budgetsApi.upsert(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["budgets"] }); toast.success("Budget saved."); },
    onError });
}

export function useUpdateBudget() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: BudgetUpdateRequest }) =>
      budgetsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }), onError });
}

export function useDeleteBudget() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => budgetsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["budgets"] }); toast.success("Budget deleted."); },
    onError });
}

// ── Support Tickets ────────────────────────────────────────────────────────

export function useSupportTickets(page = 0) {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["support-tickets", page], queryFn: () => supportApi.list(page),
    meta: { onError } });
}

export function useSupportTicket(id: string) {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["support-tickets", id], queryFn: () => supportApi.get(id),
    enabled: !!id, meta: { onError } });
}

export function useCreateTicket() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (body: CreateTicketRequest) => supportApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["support-tickets"] }); toast.success("Ticket opened."); },
    onError });
}

export function useReplyToTicket() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: MessageRequest }) =>
      supportApi.reply(id, body),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ["support-tickets", id] }), onError });
}

export function useCloseTicket() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => supportApi.close(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["support-tickets"] }); toast.success("Ticket closed."); },
    onError });
}

// ── Beneficiaries ──────────────────────────────────────────────────────────

export function useBeneficiaries() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["beneficiaries"], queryFn: beneficiariesApi.list, meta: { onError } });
}

export function useCreateBeneficiary() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (body: CreateBeneficiaryRequest) => beneficiariesApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["beneficiaries"] }); toast.success("Beneficiary added."); },
    onError });
}

export function useDeleteBeneficiary() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => beneficiariesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["beneficiaries"] }); toast.success("Beneficiary removed."); },
    onError });
}

// ── Notifications ──────────────────────────────────────────────────────────

export function useNotifications() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.list, meta: { onError } });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }), onError });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }), onError });
}

// ── Scheduled Payments ─────────────────────────────────────────────────────

export function useScheduledPayments() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["scheduled-payments"], queryFn: scheduledPaymentsApi.list, meta: { onError } });
}

export function useCreateScheduledPayment() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (body: ScheduledPaymentRequest) => scheduledPaymentsApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled-payments"] }); toast.success("Scheduled payment created."); },
    onError });
}

export function useToggleScheduledPayment() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      enable ? scheduledPaymentsApi.enable(id) : scheduledPaymentsApi.disable(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled-payments"] }), onError });
}

export function useDeleteScheduledPayment() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => scheduledPaymentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled-payments"] }); toast.success("Scheduled payment deleted."); },
    onError });
}

// ── Savings Goals ──────────────────────────────────────────────────────────

export function useSavingsGoals() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["savings-goals"], queryFn: savingsGoalsApi.list, meta: { onError } });
}

export function useCreateSavingsGoal() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (body: SavingsGoalRequest) => savingsGoalsApi.create(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["savings-goals"] }); toast.success("Goal created."); },
    onError });
}

export function useContributeToGoal() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: ContributeRequest }) =>
      savingsGoalsApi.contribute(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["savings-goals"] }); toast.success("Contribution added."); },
    onError });
}

export function useDeleteSavingsGoal() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (id: string) => savingsGoalsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["savings-goals"] }); toast.success("Goal deleted."); },
    onError });
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export function useDashboard() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.get, meta: { onError } });
}

// ── Profile ────────────────────────────────────────────────────────────────

export function useProfile() {
  const onError = useApiErrorHandler();
  return useQuery({ queryKey: ["profile"], queryFn: profileApi.get, meta: { onError } });
}

export function useUpdateProfile() {
  const qc = useQueryClient(); const onError = useApiErrorHandler();
  return useMutation({ mutationFn: (body: UpdateProfileRequest) => profileApi.update(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Profile updated."); },
    onError });
}
