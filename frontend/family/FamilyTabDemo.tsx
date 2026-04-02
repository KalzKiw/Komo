import FamilyTab from "./FamilyTab";
import type { ReactElement } from "react";
import type { FamilyLink, Order, User } from "./models";

const parentUserMock: User = {
  id: "user-parent-1",
  role: "PADRE",
  fullName: "Carmen Perez",
  email: "carmen@example.com",
  walletBalanceCents: 0,
  parentUserId: null,
  createdAt: "2026-03-25T08:30:00.000Z",
  updatedAt: "2026-03-25T08:30:00.000Z"
};

const childUserMock: User = {
  id: "user-child-1",
  role: "HIJO",
  fullName: "Sergio Perez",
  email: "sergio@example.com",
  walletBalanceCents: 120,
  parentUserId: "user-parent-1",
  createdAt: "2026-03-25T08:35:00.000Z",
  updatedAt: "2026-03-25T08:35:00.000Z"
};

const linkedChildrenMock: User[] = [
  {
    id: "user-child-1",
    role: "HIJO",
    fullName: "Sergio Perez",
    email: "sergio@example.com",
    walletBalanceCents: 120,
    parentUserId: "user-parent-1",
    createdAt: "2026-03-25T08:35:00.000Z",
    updatedAt: "2026-03-25T08:35:00.000Z"
  },
  {
    id: "user-child-2",
    role: "HIJO",
    fullName: "Alicia Perez",
    email: "alicia@example.com",
    walletBalanceCents: 800,
    parentUserId: "user-parent-1",
    createdAt: "2026-03-25T08:40:00.000Z",
    updatedAt: "2026-03-25T08:40:00.000Z"
  }
];

const parentLinkMock: FamilyLink = {
  id: "link-1",
  parentUserId: "user-parent-1",
  childUserId: null,
  linkToken: "FAM-84JQK1",
  status: "ACTIVE",
  createdAt: "2026-03-25T08:30:00.000Z",
  expiresAt: null,
  linkedAt: null
};

const orderMock: Order = {
  id: "order-991",
  childUserId: "user-child-1",
  parentUserId: "user-parent-1",
  status: "PENDING_PARENT_APPROVAL",
  paymentMode: "PARENT_APPROVAL",
  totalCents: 280,
  scheduledBreakLabel: "Recreo de las 11:00",
  requestedAt: new Date().toISOString(),
  parentDecisionAt: null,
  parentDecisionNote: null,
  items: [
    {
      productId: "prod-7",
      productName: "Bocadillo de tortilla de papas",
      quantity: 1,
      unitPriceCents: 280,
      allergens: ["Gluten", "Huevo"],
      thumbnailUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=200&q=80"
    }
  ]
};

export function ParentFamilyTabPreview(): ReactElement {
  return (
    <div className="mx-auto w-full max-w-md bg-slate-50 p-4">
      <FamilyTab
        currentUser={parentUserMock}
        parentLink={parentLinkMock}
        linkedChildren={linkedChildrenMock}
        pendingApprovalOrders={[{ order: orderMock, childName: "Sergio Perez" }]}
      />
    </div>
  );
}

export function ChildFamilyTabPreview(): ReactElement {
  return (
    <div className="mx-auto w-full max-w-md bg-slate-50 p-4">
      <FamilyTab
        currentUser={childUserMock}
        parentLink={parentLinkMock}
        linkedChildren={[]}
        pendingApprovalOrders={[]}
      />
    </div>
  );
}
