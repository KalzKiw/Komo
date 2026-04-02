export type UserRole = "PADRE" | "HIJO";

export type FamilyLinkStatus = "PENDING" | "ACTIVE" | "REVOKED";

export type OrderStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PENDING_PARENT_APPROVAL"
  | "PARENT_APPROVED"
  | "PARENT_REJECTED"
  | "PAID"
  | "IN_PREPARATION"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMode = "WALLET" | "PARENT_APPROVAL";

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  walletBalanceCents: number;
  parentUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyLink {
  id: string;
  parentUserId: string;
  childUserId: string | null;
  linkToken: string;
  status: FamilyLinkStatus;
  createdAt: string;
  expiresAt: string | null;
  linkedAt: string | null;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  allergens: string[];
  thumbnailUrl: string;
}

export interface Order {
  id: string;
  childUserId: string;
  parentUserId: string | null;
  status: OrderStatus;
  paymentMode: PaymentMode;
  totalCents: number;
  scheduledBreakLabel: string;
  requestedAt: string;
  parentDecisionAt: string | null;
  parentDecisionNote: string | null;
  items: OrderItem[];
}
