export type Role = "ROLE_USER" | "ROLE_ADMIN";
export type AdminKycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export type DisputeStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "EVIDENCE_REQUESTED"
  | "RESOLVED_CUSTOMER"
  | "RESOLVED_MERCHANT"
  | "WITHDRAWN";

export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_FOR_CUSTOMER" | "RESOLVED" | "CLOSED";
export type TicketCategory =
  | "ACCOUNT"
  | "TRANSACTION"
  | "CARD"
  | "KYC"
  | "LOAN"
  | "DISPUTE"
  | "TECHNICAL"
  | "OTHER";

export interface AdminProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  address?: string | null;
  role: Role;
  kycStatus: AdminKycStatus;
  enabled: boolean;
  locked: boolean;
  createdAt: string;
}

export interface AdminKycDocument {
  id: number;
  userId: number;
  filename: string;
  contentType: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  uploadedAt: string;
  reviewedAt?: string | null;
}

export interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AdminDispute {
  id: number;
  caseReference: string;
  userId: number;
  userName: string;
  transactionId: number;
  transactionReference: string;
  reason: string;
  description?: string | null;
  amount: number;
  currency: string;
  status: DisputeStatus;
  provisionalCreditGranted: boolean;
  provisionalCreditTransactionId?: number | null;
  clawbackTransactionId?: number | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: number;
  authorUserId: number;
  authorName: string;
  fromSupport: boolean;
  internalNote: boolean;
  body: string;
  createdAt: string;
}

export interface AdminSupportTicket {
  id: number;
  userId: number;
  userName: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  resolution?: string | null;
  assignedAdminId?: number | null;
  assignedAdminName?: string | null;
  messageCount: number;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: number;
  userId?: number | null;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string | null;
}

export interface ApiValidationError {
  code: string;
  message: string;
  status: number;
  path?: string;
  timestamp?: string;
  fieldErrors: Record<string, string>;
  details?: Record<string, unknown>;
}

export interface AdminDepositRequest {
  accountId: number;
  amount: number;
  description: string;
  category: "ADMIN_ADJUSTMENT";
}
