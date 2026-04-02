// ─── Domain models ────────────────────────────────────────────────────────────

export type FamilyUserRole = "ADMIN" | "PARENT" | "STUDENT";
export type FamilyLinkStatus = "ACTIVE" | "PENDING" | "REVOKED";

/** Slim user representation used across family views */
export interface FamilyUser {
  id: string;
  /** 6-char display code, e.g. "EST-001" */
  shortId: string;
  role: FamilyUserRole;
  name: string;
  /** EUR */
  walletBalance: number;
}

/** Temporary 6-char token the parent generates for the student to enter */
export interface LinkingToken {
  /** e.g. "X7B-9PQ" */
  tokenCode: string;
  parentId: string;
  /** ISO datetime string */
  expiresAt: string;
}

/** Junction between parent and student */
export interface FamilyLink {
  id: string;
  parentId: string;
  studentId: string;
  status: FamilyLinkStatus;
  createdAt: string;
}

/** Aggregated view for the admin table */
export interface FamilyRelationship {
  link: FamilyLink;
  parent: FamilyUser;
  students: FamilyUser[];
  /** Sum of all members' wallet balances */
  totalBalance: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export const MOCK_PARENTS: FamilyUser[] = [
  { id: "par-1", shortId: "PAR-001", role: "PARENT", name: "Carmen García", walletBalance: 45.50 },
  { id: "par-2", shortId: "PAR-002", role: "PARENT", name: "Javier Moreno", walletBalance: 12.00 },
  { id: "par-3", shortId: "PAR-003", role: "PARENT", name: "Lucía Fernández", walletBalance: 30.00 },
];

export const MOCK_STUDENTS: FamilyUser[] = [
  { id: "stu-1", shortId: "EST-001", role: "STUDENT", name: "Daniel García", walletBalance: 8.75 },
  { id: "stu-2", shortId: "EST-002", role: "STUDENT", name: "Sofía García", walletBalance: 4.20 },
  { id: "stu-3", shortId: "EST-003", role: "STUDENT", name: "Pablo Moreno", walletBalance: 2.50 },
  { id: "stu-4", shortId: "EST-004", role: "STUDENT", name: "Marta Fernández", walletBalance: 11.00 },
  { id: "stu-5", shortId: "EST-005", role: "STUDENT", name: "Andrea Fernández", walletBalance: 6.60 },
];

export const MOCK_LINKS: FamilyLink[] = [
  { id: "lnk-1", parentId: "par-1", studentId: "stu-1", status: "ACTIVE", createdAt: "2026-03-10T08:00:00Z" },
  { id: "lnk-2", parentId: "par-1", studentId: "stu-2", status: "ACTIVE", createdAt: "2026-03-10T08:05:00Z" },
  { id: "lnk-3", parentId: "par-2", studentId: "stu-3", status: "ACTIVE", createdAt: "2026-03-15T09:00:00Z" },
  { id: "lnk-4", parentId: "par-3", studentId: "stu-4", status: "ACTIVE", createdAt: "2026-03-20T10:00:00Z" },
  { id: "lnk-5", parentId: "par-3", studentId: "stu-5", status: "ACTIVE", createdAt: "2026-03-20T10:10:00Z" },
];

/** Pre-built relationships for the admin table */
export const MOCK_RELATIONSHIPS: FamilyRelationship[] = [
  {
    link: MOCK_LINKS[0],
    parent: MOCK_PARENTS[0],
    students: [MOCK_STUDENTS[0], MOCK_STUDENTS[1]],
    totalBalance: MOCK_PARENTS[0].walletBalance + MOCK_STUDENTS[0].walletBalance + MOCK_STUDENTS[1].walletBalance,
  },
  {
    link: MOCK_LINKS[2],
    parent: MOCK_PARENTS[1],
    students: [MOCK_STUDENTS[2]],
    totalBalance: MOCK_PARENTS[1].walletBalance + MOCK_STUDENTS[2].walletBalance,
  },
  {
    link: MOCK_LINKS[3],
    parent: MOCK_PARENTS[2],
    students: [MOCK_STUDENTS[3], MOCK_STUDENTS[4]],
    totalBalance: MOCK_PARENTS[2].walletBalance + MOCK_STUDENTS[3].walletBalance + MOCK_STUDENTS[4].walletBalance,
  },
];

/** Generate a random 7-char token in the format "XXX-XXX" */
export function generateTokenCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = (n: number) => chars[Math.floor(Math.random() * n)];
  return `${rand(32)}${rand(32)}${rand(32)}-${rand(32)}${rand(32)}${rand(32)}`;
}
