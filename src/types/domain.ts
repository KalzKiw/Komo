export type UserRole = "ADMIN" | "STAFF" | "STUDENT" | "DELEGATE" | "PARENT";

export type OrderShift = "MORNING" | "AFTERNOON" | "NIGHT";

export type OrderStatus = "PENDING" | "IN_PREPARATION" | "READY" | "DELIVERED" | "CANCELLED";

export type FamilyRelation = "PARENT" | "DELEGATE";

export interface AuthUser {
  id: string;
  role: UserRole;
  isBeneficiary: boolean;
}
